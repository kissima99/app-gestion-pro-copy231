// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 1. STRIPE VERIFICATION
async function verifyStripe(transactionId: string, expectedAmount?: number) {
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecret) {
    throw new Error("[verify-payment] STRIPE_SECRET_KEY is not configured");
  }

  const url = transactionId.startsWith('cs_') 
    ? `https://api.stripe.com/v1/checkout/sessions/${transactionId}`
    : `https://api.stripe.com/v1/payment_intents/${transactionId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${stripeSecret}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[verify-payment] Stripe API error: ${errText}`);
    throw new Error("Impossible de vérifier la transaction auprès de Stripe");
  }

  const data = await response.json();
  const isPaid = transactionId.startsWith('cs_')
    ? data.payment_status === 'paid'
    : data.status === 'succeeded';

  if (!isPaid) {
    throw new Error("Le paiement Stripe n'a pas été complété");
  }

  if (expectedAmount) {
    const amountPaid = transactionId.startsWith('cs_') ? data.amount_total : data.amount;
    const expectedCents = expectedAmount * 100;
    if (Math.abs(amountPaid - expectedCents) > 100) {
      throw new Error("Le montant payé ne correspond pas au montant attendu");
    }
  }

  return true;
}

// 2. WAVE VERIFICATION
async function verifyWave(transactionId: string) {
  const waveSecret = Deno.env.get('WAVE_SECRET_KEY');
  if (!waveSecret) {
    throw new Error("[verify-payment] WAVE_SECRET_KEY is not configured");
  }

  const response = await fetch(`https://api.wave.com/v1/checkout/sessions/${transactionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${waveSecret}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[verify-payment] Wave API error: ${errText}`);
    throw new Error("Impossible de vérifier la transaction auprès de Wave");
  }

  const data = await response.json();
  if (data.payment_status !== 'succeeded' && data.status !== 'complete') {
    throw new Error("Le paiement Wave n'a pas été complété");
  }

  return true;
}

// 3. PAYTECH VERIFICATION (Sénégal)
async function verifyPaytech(transactionId: string) {
  const apiKey = Deno.env.get('PAYTECH_API_KEY');
  const apiSecret = Deno.env.get('PAYTECH_API_SECRET');
  if (!apiKey || !apiSecret) {
    throw new Error("[verify-payment] PAYTECH credentials are not configured");
  }

  const response = await fetch(`https://paytech.sn/api/payment/status/${transactionId}`, {
    method: 'GET',
    headers: {
      'API_KEY': apiKey,
      'API_SECRET': apiSecret,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[verify-payment] Paytech API error: ${errText}`);
    throw new Error("Impossible de vérifier la transaction auprès de Paytech");
  }

  const data = await response.json();
  if (data.status !== 'success') {
    throw new Error("Le paiement Paytech n'a pas été complété");
  }

  return true;
}

// 4. SECURE TEST VERIFICATION (HMAC Signature)
async function verifyTestPayment(transactionId: string, signature?: string) {
  const isDev = Deno.env.get('ENVIRONMENT') === 'development' || Deno.env.get('ALLOW_TEST_PAYMENTS') === 'true';
  if (!isDev) {
    throw new Error("Les paiements de test ne sont pas autorisés en production");
  }

  if (!signature) {
    throw new Error("Signature de test manquante");
  }

  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'test-secret';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const sigBuffer = new Uint8Array(
    signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    cryptoKey,
    sigBuffer,
    encoder.encode(transactionId)
  );

  if (!isValid) {
    throw new Error("Signature de test invalide");
  }

  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[verify-payment] Démarrage de la vérification sécurisée");

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[verify-payment] Tentative d'accès non autorisé (pas de header)");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error("[verify-payment] Session utilisateur invalide");
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { transactionId, amount, provider, signature } = await req.json();

    if (!transactionId) {
      console.error("[verify-payment] transactionId manquant pour l'utilisateur:", user.id);
      return new Response(JSON.stringify({ error: 'Transaction ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. VÉRIFICATION D'IDEMPOTENCE : Empêcher la réutilisation d'un ID de transaction
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existingPayment) {
      console.warn("[verify-payment] Tentative de réutilisation d'un ID de transaction :", transactionId);
      return new Response(JSON.stringify({ error: 'Cette transaction a déjà été traitée' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. VÉRIFICATION EXTERNE SÉCURISÉE
    console.log(`[verify-payment] Vérification de la transaction ${transactionId} via ${provider}`);
    
    const normalizedProvider = (provider || '').toLowerCase();
    
    if (normalizedProvider === 'stripe') {
      await verifyStripe(transactionId, amount);
    } else if (normalizedProvider === 'wave') {
      await verifyWave(transactionId);
    } else if (normalizedProvider === 'paytech') {
      await verifyPaytech(transactionId);
    } else if (normalizedProvider === 'test' || normalizedProvider === 'mock') {
      await verifyTestPayment(transactionId, signature);
    } else {
      throw new Error(`Fournisseur de paiement non supporté ou non configuré : ${provider}`);
    }

    // 3. ENREGISTREMENT DU PAIEMENT (Piste d'audit)
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        transaction_id: transactionId,
        amount: amount,
        provider: provider,
        status: 'completed'
      });

    if (paymentError) {
      console.error("[verify-payment] Erreur lors de l'enregistrement du paiement :", paymentError);
      throw new Error("Erreur base de données lors de l'enregistrement");
    }

    // 4. MISE À JOUR DU PROFIL
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ has_paid: true })
      .eq('id', user.id);

    if (updateError) {
      console.error("[verify-payment] Erreur lors de la mise à jour du profil :", updateError);
      throw new Error("Erreur base de données lors de la mise à jour du profil");
    }

    console.log("[verify-payment] Paiement vérifié et accès accordé pour :", user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Paiement vérifié avec succès' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error("[verify-payment] Erreur critique :", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})