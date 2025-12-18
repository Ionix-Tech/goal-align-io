import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-side validation schema with proper format and length constraints
const notificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  projectId: z.string().uuid('Invalid project ID format').optional(),
  type: z.string().min(1, 'Type is required').max(50, 'Type must be 50 characters or less'),
  message: z.string().min(1, 'Message is required').max(500, 'Message must be 500 characters or less'),
});

type NotificationRequest = z.infer<typeof notificationSchema>;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated by checking JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create a Supabase client with the user's JWT to validate it
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Validate the JWT and get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Parse and validate request body with Zod schema
    const rawBody = await req.json();
    const parseResult = notificationSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.warn('Validation failed:', errorMessages);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errorMessages}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { userId, projectId, type, message } = parseResult.data;

    // Verify the authenticated user has access to the project (if projectId is provided)
    if (projectId) {
      const { data: hasAccess, error: accessError } = await supabaseClient.rpc('user_has_project_access', {
        _user_id: user.id,
        _project_id: projectId
      });

      if (accessError) {
        console.error('Access check error:', accessError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify project access' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!hasAccess) {
        console.warn(`User ${user.id} attempted to create notification for project ${projectId} without access`);
        return new Response(
          JSON.stringify({ error: 'User does not have access to this project' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Initialize Supabase admin client for creating the notification
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log(`Creating notification for user ${userId}: ${type}`);

    // Create notification using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        project_id: projectId,
        type: type,
        message: message,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    console.log('Notification created successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-notification function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
