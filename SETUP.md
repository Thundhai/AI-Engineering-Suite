# Setup

This app is a React/Vite frontend backed by Supabase (Auth, Postgres, Storage,
and one Edge Function that holds the Gemini API key). Nothing secret ever
ships to the browser — follow these steps once per Supabase project.

## 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com) if you don't have
one yet. You'll need:
- The **Project URL** and **anon public key** (Settings → API) for the frontend.
- The [Supabase CLI](https://supabase.com/docs/guides/cli) installed locally to run the migration and deploy the Edge Function.

## 2. Run the database migration

In the Supabase dashboard's SQL Editor, paste and run the contents of
`supabase/migrations/0001_init.sql`. This creates the `projects`,
`project_versions`, `chat_messages`, and `project_files` tables (all with
Row Level Security scoped to the signed-in user) and a private
`project-files` Storage bucket.

If you use the CLI instead: `supabase link --project-ref <your-project-ref>` then `supabase db push`.

## 3. Deploy the Edge Function

```
supabase functions deploy gemini-proxy
```

Then set the Gemini key as a function secret — this is the only place it
ever lives:

```
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
```

Get a Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

## 4. Configure the frontend

Copy `.env.example` to `.env.local` and fill in your project's URL and anon
key:

```
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

The anon key is safe to expose in the browser — Row Level Security is what
actually restricts access, not this key. The Gemini key is never set here.

## 5. Install and run

```
npm install
npm run dev
```

Sign up for an account in the app, create a project, and generate a report.
Your projects, files, and reports are stored in your Supabase project and
are private to your account.

## Verifying it's working end to end

1. Sign up, create a project, attach a file, and generate a report.
2. Reload the page — the project, its files, and the report should still be there (proves persistence, not localStorage).
3. Sign in from a different browser (or an incognito window) with the same account — you should see the same project (proves the data lives server-side, not in one browser).
4. Open your browser's dev tools → Network tab while generating a report — you should NOT see any request containing a Gemini API key; the only outgoing request is to your Supabase project's `gemini-proxy` function.
