import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateUserRoleRequest {
  user_id: string
  new_role: 'ceo' | 'pmo_manager' | 'project_member'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[update-user-role] No authorization header')
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create user client to verify caller
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Get the calling user
    const { data: { user: caller }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !caller) {
      console.error('[update-user-role] Failed to get caller:', userError)
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[update-user-role] Caller:', caller.id, caller.email)

    // Check if caller has CEO role (only CEO can change roles)
    const { data: callerRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .single()

    if (roleError || !callerRole) {
      console.error('[update-user-role] Caller role not found:', roleError)
      return new Response(
        JSON.stringify({ error: 'Permissão negada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (callerRole.role !== 'ceo') {
      console.error('[update-user-role] Only CEO can change roles')
      return new Response(
        JSON.stringify({ error: 'Apenas o CEO pode alterar roles de usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: UpdateUserRoleRequest = await req.json()
    console.log('[update-user-role] Updating user:', body.user_id, 'to role:', body.new_role)

    // Validate required fields
    if (!body.user_id || !body.new_role) {
      return new Response(
        JSON.stringify({ error: 'user_id e new_role são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent CEO from changing their own role
    if (body.user_id === caller.id) {
      return new Response(
        JSON.stringify({ error: 'Você não pode alterar sua própria role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the role
    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .update({ role: body.new_role })
      .eq('user_id', body.user_id)

    if (updateError) {
      console.error('[update-user-role] Error updating role:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[update-user-role] Role updated successfully')

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[update-user-role] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
