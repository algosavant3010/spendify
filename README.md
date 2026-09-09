# Spendify

Spendify is a smart personal finance tracker for managing expenses, budgets, savings goals, and AI-powered financial insights.

## Worql SOW acceptance criteria

This index preserves the exact acceptance-criterion wording supplied for the SOW so Worql can discover and match every requirement. Evidence, coverage status, and outstanding verification are recorded in the [SOW evidence map](docs/sow-evidence-map.md).

### 1. Analytics & Reporting Dashboard

- **AC-1.1:** Dashboard renders within 2 seconds at p95 on the benchmark dataset (Verification: performance test)
- **AC-1.2:** Category spending chart totals reconcile exactly with underlying transaction records (Verification: reconciliation test)
- **AC-1.3:** Budget vs. actual view updates within 5 seconds of a new transaction being recorded (Verification: functional test)

### 2. Supabase Data Platform & Backend Integration

- **AC-2.1:** A user can only read or modify their own records under row-level security policies (Verification: security test)
- **AC-2.2:** Schema migrations run cleanly against a fresh Supabase project without manual intervention (Verification: deployment test)
- **AC-2.3:** All application features successfully read/write through the data access layer in integration testing (Verification: integration test suite)

### 3. Deployment & Production Environment Setup

- **AC-3.1:** Production deployment completes successfully via the CI/CD pipeline without manual patching (Verification: deployment log review)
- **AC-3.2:** Application error monitoring captures and logs unhandled exceptions in production (Verification: monitoring dashboard review)
- **AC-3.3:** Deployment & Production Environment Setup is demonstrated in a reviewable environment and passes its agreed automated tests. (Verification: CI test run + deployment log) [Worql's wording — not stated by the parties.]

### 4. User Account & Authentication Service

- **AC-4.1:** New user registration succeeds and creates a corresponding Supabase Auth record (Verification: functional test)
- **AC-4.2:** Login with valid credentials issues a valid session token within 2 seconds (Verification: automated test)
- **AC-4.3:** Password reset email is delivered and reset flow updates credentials successfully (Verification: manual QA test)
- **AC-4.4:** Invalid login attempts are rejected with an appropriate error message (Verification: automated test)

### 5. Expense & Transaction Tracking Module

- **AC-5.1:** User can create a transaction with amount, category, and date, and it appears in the transaction list within 2 seconds (Verification: functional test)
- **AC-5.2:** Editing a transaction updates all dependent views (budgets, analytics) without page reload errors (Verification: QA test)
- **AC-5.3:** Deleting a transaction removes it from the list and underlying database record (Verification: automated test)
- **AC-5.4:** Transaction list supports filtering by category and date range (Verification: functional test)

### 6. Budgeting & Savings Goals Engine

- **AC-6.1:** User can create a monthly budget for a category and view real-time spend-to-budget progress (Verification: functional test)
- **AC-6.2:** Savings goal progress updates correctly when a contribution is recorded (Verification: functional test)
- **AC-6.3:** System flags when spend in a category exceeds 90% of the set budget (Verification: automated test)

### 7. Bill Tracking & Reminders

- **AC-7.1:** User can create a bill with due date, amount, and recurrence, and it appears on the bill calendar (Verification: functional test)
- **AC-7.2:** Reminder is generated within the configured lead time before the due date (Verification: automated test)
- **AC-7.3:** Marking a bill as paid updates its status and excludes it from active reminders (Verification: functional test)

The supplied SOW extract also names scope 8, **AI-Powered Financial Insights Engine**, but does not include any acceptance criteria for that scope. Add its agreed criteria here and to the evidence map when they are available.

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
