# AI Engineering Suite

A multidisciplinary engineering assistant: describe a project, activate the
relevant engineering agents (civil, structural, mechanical, electrical,
MEP, and more), and generate a structured technical report — with project
history, versioning, file attachments, and geospatial context.

The Gemini API key never reaches the browser. It lives only in a Supabase
Edge Function; the frontend talks to Supabase for auth, data, and file
storage, and calls that function to generate reports.

## Setup

See [SETUP.md](SETUP.md) for the full walkthrough (create a Supabase
project, run the migration, deploy the Edge Function, configure the
frontend). Short version:

```
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — type-check
- `npm test` — run the test suite
