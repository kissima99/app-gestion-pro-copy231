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
    console.log("[manage-users] Request received");

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error("[manage-users] Unauthorized: No Authorization header");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user and get their profile to check if they are admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      console.error("[manage-users] Unauthorized: Invalid token", authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || callerProfile?.role !== 'admin') {
      console.error("[manage-users] Forbidden: User is not an admin", profileError);
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'GET' && action === 'list') {
      console.log("[manage-users] Listing profiles");
      const { data: profiles, error: listError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })

      if (listError) {
        console.error("[manage-users] Error listing profiles", listError);
        throw listError;
      }

      return new Response(JSON.stringify({ profiles }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST') {
      const { userId, updates } = await req.json()
      if (!userId || !updates) {
        return new Response(JSON.stringify({ error: 'Missing userId or updates' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log(`[manage-users] Updating user ${userId}`, updates);

      // Restrict updates to allowed fields: role, has_paid
      const allowedUpdates: any = {}
      if (updates.role !== undefined) {
        allowedUpdates.role = updates.role
      }
      if (updates.has_paid !== undefined) {
        allowedUpdates.has_paid = updates.has_paid
      }

      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(allowedUpdates)
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        console.error("[manage-users] Error updating profile", updateError);
        throw updateError;
      }

      return new Response(JSON.stringify({ profile: updatedProfile }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error("[manage-users] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})