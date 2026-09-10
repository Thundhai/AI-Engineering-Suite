import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
    // NOTE: no server-side secret (Gemini API key) is ever exposed to the
    // client here. The only env vars the client needs are the public
    // Supabase URL and anon key, which Vite already exposes automatically
    // via import.meta.env because they're prefixed with VITE_ (see .env.example).
    // The Gemini key lives only in the Supabase Edge Function's secrets.
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
