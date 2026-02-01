import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_USERS = [
  { email: 'ceo@compass.com', full_name: 'CEO Compass', role: 'ceo' },
  { email: 'pmo@compass.com', full_name: 'PMO Manager', role: 'pmo_manager' },
  { email: 'membro1@compass.com', full_name: 'Membro 1', role: 'project_member' },
  { email: 'membro2@compass.com', full_name: 'Membro 2', role: 'project_member' },
  { email: 'membro3@compass.com', full_name: 'Membro 3', role: 'project_member' },
  { email: 'membro4@compass.com', full_name: 'Membro 4', role: 'project_member' },
  { email: 'membro5@compass.com', full_name: 'Membro 5', role: 'project_member' },
  { email: 'membro6@compass.com', full_name: 'Membro 6', role: 'project_member' },
  { email: 'membro7@compass.com', full_name: 'Membro 7', role: 'project_member' },
  { email: 'membro8@compass.com', full_name: 'Membro 8', role: 'project_member' },
  { email: 'membro9@compass.com', full_name: 'Membro 9', role: 'project_member' },
  { email: 'membro10@compass.com', full_name: 'Membro 10', role: 'project_member' },
  { email: 'membro11@compass.com', full_name: 'Membro 11', role: 'project_member' },
  { email: 'membro12@compass.com', full_name: 'Membro 12', role: 'project_member' },
  { email: 'membro13@compass.com', full_name: 'Membro 13', role: 'project_member' },
  { email: 'membro14@compass.com', full_name: 'Membro 14', role: 'project_member' },
];

const DEFAULT_PASSWORD = 'Compass2025!';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is CEO
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user: caller } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (!caller) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .single();

    if (callerRole?.role !== 'ceo') {
      return new Response(
        JSON.stringify({ error: 'Apenas CEO pode criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const users = body.users || DEFAULT_USERS;
    const password = body.password || DEFAULT_PASSWORD;

    const results: Array<{ email: string; status: string; error?: string }> = [];

    for (const u of users) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name },
        });

        if (error) {
          if (error.message?.includes('already been registered')) {
            results.push({ email: u.email, status: 'already_exists' });
          } else {
            results.push({ email: u.email, status: 'error', error: error.message });
          }
          continue;
        }

        // Set role
        if (data.user && u.role) {
          await supabase.from('user_roles').upsert({
            user_id: data.user.id,
            role: u.role,
          });
        }

        results.push({ email: u.email, status: 'created' });
      } catch (err) {
        results.push({ email: u.email, status: 'error', error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
