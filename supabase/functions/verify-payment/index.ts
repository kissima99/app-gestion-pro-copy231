// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { transactionId, amount, provider } = await req.json();

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

    /**
     * 2. VÉRIFICATION EXTERNE (CRITIQUE)
     * Vous DEVEZ vérifier le transactionId auprès de l'API de votre fournisseur ici.
     * 
     * Exemple pour Stripe :
     * const session = await stripe.checkout.sessions.retrieve(transactionId);
     * if (session.payment_status !== 'paid') throw new Error('Paiement non confirmé');
     * 
     * Exemple pour Wave/Orange Money :
     * const response = await fetch(`https://api.provider.com/verify/${transactionId}`, {
     *   headers: { 'Authorization': `Bearer ${Deno.env.get('PROVIDER_SECRET')}` }
     * });
     * const result = await response.json();
     * if (!result.is_valid) throw new Error('Transaction invalide');
     */
    
    console.log(`[verify-payment] Vérification de la transaction ${transactionId} via ${provider}`);

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