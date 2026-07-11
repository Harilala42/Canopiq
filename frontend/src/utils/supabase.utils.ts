import { createClient } from '@supabase/supabase-js';
import { apiClient } from '@/utils/axios.utils';

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        }
    }
);

export async function syncRealtimeSession() {
    try {
        const response = await apiClient.get(
            import.meta.env.VITE_API_AUTH_GET_SESSION
        );

        const { access_token } = response.data;

        supabase.realtime.setAuth(access_token);

        console.log("Supabase Realtime synchronized.");
    } catch (err) {
        console.error("Could not sync Realtime session:", err);
    }
}
