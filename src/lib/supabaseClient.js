
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_project_url')) {
    console.warn("Supabase URL or Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
    if (typeof window !== 'undefined') {
        // Short timeout to allow the page to render first
        setTimeout(() => {
            alert("⚠️ Supabase Credentials Missing!\n\nIt looks like you haven't set up your .env file yet.\n\n1. Create a file named .env in the project root.\n2. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n3. Restart the dev server.");
        }, 1000);
    }
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);
