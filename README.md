# Spendify

Spendify is a smart personal finance tracker for managing expenses, budgets, savings goals, and AI-powered financial insights.

## Local development

Create `.env.local` with your own Supabase project values, then install and start the app:

```sh
npm install
npm run dev
```

## Scripts

```sh
npm run dev
npm run lint
npm run build
npm run preview
```

## Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Deployment

Build with `npm run build` and deploy the generated `dist` directory to any static hosting provider. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the hosting environment.

## AI configuration

Supabase Edge Functions use Groq's OpenAI-compatible chat completions API. Keep the Groq key server-side: never add it to a `VITE_*` variable or frontend file.

```sh
supabase secrets set GROQ_API_KEY=your_key ALLOWED_ORIGIN=https://your-app.example
```

Optionally set `GROQ_MODEL`; otherwise the functions default to `qwen/qwen3.6-27b`. Deploy after setting secrets:

```sh
supabase functions deploy
```

For local Edge Function calls, `http://localhost:5173` and `http://localhost:8080` are allowed by default. In production, `ALLOWED_ORIGIN` must exactly match the deployed frontend origin.

## Production security

- Keep `.env.local` private and expose only the Supabase anon key to the browser.
- Keep the `receipts` storage bucket private; the app generates five-minute signed URLs for previews.
- Configure HSTS, `X-Frame-Options: DENY`, and a `Permissions-Policy` as HTTP response headers in your hosting provider. The app includes a CSP fallback in `index.html`.
