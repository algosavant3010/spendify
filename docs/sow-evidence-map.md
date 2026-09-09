# SOW evidence map

This document maps every acceptance criterion supplied for client review to repository evidence. The wording is copied verbatim from the SOW extract. Source-code links demonstrate implementation only; they do not replace the verification method or the client's required written sign-off.

## Status legend

- **Source mapped**: relevant implementation is present; the specified test or review artifact still needs to be attached in Worql.
- **Partial**: some supporting implementation exists, but the full criterion is not implemented or its required behavior differs.
- **Gap**: no implementation or verification artifact satisfying the criterion was found in this repository.

## 1. Analytics & Reporting Dashboard

### AC-1.1

**Requirement:** Dashboard renders within 2 seconds at p95 on the benchmark dataset (Verification: performance test)

- **Status:** Source mapped; performance evidence pending.
- **Implementation evidence:** [`src/pages/Dashboard.tsx`](../src/pages/Dashboard.tsx#L171-L191) composes the reporting dashboard.
- **Attach for acceptance:** a benchmark-dataset performance report containing the p95 render time, environment, dataset size, run count, and commit SHA.

### AC-1.2

**Requirement:** Category spending chart totals reconcile exactly with underlying transaction records (Verification: reconciliation test)

- **Status:** Source mapped; reconciliation evidence pending.
- **Implementation evidence:** [`src/components/dashboard/SpendingChart.tsx`](../src/components/dashboard/SpendingChart.tsx#L57-L75) reads expense transactions and reduces amounts by category; [`src/components/dashboard/CategoryBreakdown.tsx`](../src/components/dashboard/CategoryBreakdown.tsx#L23-L35) performs the corresponding category aggregation.
- **Attach for acceptance:** reconciliation-test output comparing chart totals with the benchmark transaction rows and showing zero variance.

### AC-1.3

**Requirement:** Budget vs. actual view updates within 5 seconds of a new transaction being recorded (Verification: functional test)

- **Status:** Source mapped; timing evidence pending.
- **Implementation evidence:** [`src/components/transactions/AddTransactionDialog.tsx`](../src/components/transactions/AddTransactionDialog.tsx#L217-L252) inserts the transaction and invalidates the spending-chart and budget queries; [`src/components/dashboard/BudgetOverview.tsx`](../src/components/dashboard/BudgetOverview.tsx#L35-L58) recalculates actual spend from transactions.
- **Attach for acceptance:** functional-test output measuring elapsed time from a successful insert to the refreshed budget-vs-actual UI.

## 2. Supabase Data Platform & Backend Integration

### AC-2.1

**Requirement:** A user can only read or modify their own records under row-level security policies (Verification: security test)

- **Status:** Source mapped; security-test evidence pending.
- **Implementation evidence:** [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql#L111-L148) enables RLS and defines per-user select, insert, update, and delete policies for application tables. Receipt storage is also user-scoped in [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql#L164-L173).
- **Attach for acceptance:** an authenticated two-user security-test transcript proving cross-user reads and writes are denied for every protected table and storage path.

### AC-2.2

**Requirement:** Schema migrations run cleanly against a fresh Supabase project without manual intervention (Verification: deployment test)

- **Status:** Source mapped; fresh-project deployment evidence pending.
- **Implementation evidence:** [`supabase/migrations/`](../supabase/migrations/) contains the ordered database migrations and [`supabase/config.toml`](../supabase/config.toml) contains the local project configuration.
- **Attach for acceptance:** a clean `supabase db reset` or fresh-project deployment log, including the commit SHA and exit status.

### AC-2.3

**Requirement:** All application features successfully read/write through the data access layer in integration testing (Verification: integration test suite)

- **Status:** Partial; data-access calls are mapped, but no integration test suite is present.
- **Implementation evidence:** [`src/integrations/supabase/client.ts`](../src/integrations/supabase/client.ts) centralizes the client; representative reads/writes appear in [`src/pages/Transactions.tsx`](../src/pages/Transactions.tsx#L52-L86), [`src/components/budget/BudgetManagement.tsx`](../src/components/budget/BudgetManagement.tsx#L42-L88), and [`src/pages/SavingsGoals.tsx`](../src/pages/SavingsGoals.tsx#L38-L81).
- **Attach for acceptance:** passing integration-suite output covering every application data path against an isolated Supabase project.

## 3. Deployment & Production Environment Setup

### AC-3.1

**Requirement:** Production deployment completes successfully via the CI/CD pipeline without manual patching (Verification: deployment log review)

- **Status:** Partial; a production build and Vercel routing configuration exist, but no repository CI/CD workflow or deployment log is present.
- **Implementation evidence:** [`package.json`](../package.json#L6-L11) defines the production build and [`vercel.json`](../vercel.json) defines SPA routing.
- **Attach for acceptance:** the successful production pipeline and deployment logs for this commit, with no manual repair steps.

### AC-3.2

**Requirement:** Application error monitoring captures and logs unhandled exceptions in production (Verification: monitoring dashboard review)

- **Status:** Gap; no production error-monitoring SDK/configuration or dashboard artifact was found.
- **Attach for acceptance:** monitoring integration source/configuration plus a dashboard capture of a deliberately generated unhandled exception from production.

### AC-3.3

**Requirement:** Deployment & Production Environment Setup is demonstrated in a reviewable environment and passes its agreed automated tests. (Verification: CI test run + deployment log) [Worql's wording — not stated by the parties.]

- **Status:** Partial; build configuration exists, but no agreed automated test suite, CI result, review URL, or deployment log is stored here.
- **Implementation evidence:** [`package.json`](../package.json#L6-L11) and [`vercel.json`](../vercel.json).
- **Attach for acceptance:** review-environment URL, CI test result, and deployment log tied to this commit.

## 4. User Account & Authentication Service

### AC-4.1

**Requirement:** New user registration succeeds and creates a corresponding Supabase Auth record (Verification: functional test)

- **Status:** Source mapped; functional-test evidence pending.
- **Implementation evidence:** [`src/pages/Auth.tsx`](../src/pages/Auth.tsx#L43-L65) calls Supabase Auth sign-up; [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql#L219-L248) creates the related profile after an Auth user is inserted.
- **Attach for acceptance:** a functional-test record showing the UI result and matching Auth user/profile IDs.

### AC-4.2

**Requirement:** Login with valid credentials issues a valid session token within 2 seconds (Verification: automated test)

- **Status:** Source mapped; automated timing/token evidence pending.
- **Implementation evidence:** [`src/pages/Auth.tsx`](../src/pages/Auth.tsx#L90-L116) signs in with a password and verifies the authenticated user before navigation.
- **Attach for acceptance:** an automated test asserting a valid session and an elapsed time below two seconds.

### AC-4.3

**Requirement:** Password reset email is delivered and reset flow updates credentials successfully (Verification: manual QA test)

- **Status:** Gap; no password-reset request or credential-update flow was found.
- **Attach for acceptance:** implementation evidence plus a manual QA record covering email receipt, reset-link handling, credential update, and login with the new password.

### AC-4.4

**Requirement:** Invalid login attempts are rejected with an appropriate error message (Verification: automated test)

- **Status:** Source mapped; automated-test evidence pending.
- **Implementation evidence:** [`src/pages/Auth.tsx`](../src/pages/Auth.tsx#L90-L121) handles Supabase login failures and shows the error to the user.
- **Attach for acceptance:** automated negative-login test output asserting rejection and the displayed message.

## 5. Expense & Transaction Tracking Module

### AC-5.1

**Requirement:** User can create a transaction with amount, category, and date, and it appears in the transaction list within 2 seconds (Verification: functional test)

- **Status:** Source mapped; functional timing evidence pending.
- **Implementation evidence:** [`src/components/transactions/AddTransactionDialog.tsx`](../src/components/transactions/AddTransactionDialog.tsx#L217-L252) inserts the required transaction fields and refreshes transaction queries; [`src/pages/Transactions.tsx`](../src/pages/Transactions.tsx#L52-L86) loads the transaction list.
- **Attach for acceptance:** a functional-test record measuring successful creation-to-list visibility below two seconds.

### AC-5.2

**Requirement:** Editing a transaction updates all dependent views (budgets, analytics) without page reload errors (Verification: QA test)

- **Status:** Gap; no transaction update operation or edit UI was found.
- **Attach for acceptance:** implementation evidence and a QA record showing the edited value in transactions, budgets, and analytics without a reload error.

### AC-5.3

**Requirement:** Deleting a transaction removes it from the list and underlying database record (Verification: automated test)

- **Status:** Gap; no transaction delete operation was found.
- **Attach for acceptance:** implementation evidence and an automated test asserting removal from both UI and database.

### AC-5.4

**Requirement:** Transaction list supports filtering by category and date range (Verification: functional test)

- **Status:** Source mapped; functional-test evidence pending.
- **Implementation evidence:** [`src/pages/Transactions.tsx`](../src/pages/Transactions.tsx#L52-L84) applies category and start/end-date predicates; [`src/components/transactions/TransactionFilters.tsx`](../src/components/transactions/TransactionFilters.tsx#L111-L184) exposes the corresponding controls.
- **Attach for acceptance:** a functional-test record using seeded transactions that proves category and inclusive date-range results.

## 6. Budgeting & Savings Goals Engine

### AC-6.1

**Requirement:** User can create a monthly budget for a category and view real-time spend-to-budget progress (Verification: functional test)

- **Status:** Source mapped; functional-test evidence pending.
- **Implementation evidence:** [`src/components/budget/BudgetManagement.tsx`](../src/components/budget/BudgetManagement.tsx#L42-L60) creates and refreshes budgets; [`src/components/dashboard/BudgetOverview.tsx`](../src/components/dashboard/BudgetOverview.tsx#L22-L58) calculates category spending and progress.
- **Attach for acceptance:** a functional-test record showing budget creation and progress changing after a matching transaction.

### AC-6.2

**Requirement:** Savings goal progress updates correctly when a contribution is recorded (Verification: functional test)

- **Status:** Partial; initial progress can be recorded and displayed, but no contribution/update operation was found.
- **Implementation evidence:** [`src/pages/SavingsGoals.tsx`](../src/pages/SavingsGoals.tsx#L83-L93) records an initial current amount and [`src/pages/SavingsGoals.tsx`](../src/pages/SavingsGoals.tsx#L163-L211) calculates and displays progress.
- **Attach for acceptance:** contribution-update implementation plus a functional test proving the persisted amount and recalculated percentage.

### AC-6.3

**Requirement:** System flags when spend in a category exceeds 90% of the set budget (Verification: automated test)

- **Status:** Partial; threshold alerts exist, but the schema default is 80%, not the criterion's 90%.
- **Implementation evidence:** [`src/components/dashboard/BudgetOverview.tsx`](../src/components/dashboard/BudgetOverview.tsx#L45-L70) calculates and displays threshold alerts; [`supabase/functions/check-budget-alerts/index.ts`](../supabase/functions/check-budget-alerts/index.ts#L52-L78) provides the server calculation; [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql#L51-L63) sets the default threshold to `0.80`.
- **Attach for acceptance:** align the default/required threshold with the SOW, then attach an automated boundary test for below, at, and above 90%.

## 7. Bill Tracking & Reminders

### AC-7.1

**Requirement:** User can create a bill with due date, amount, and recurrence, and it appears on the bill calendar (Verification: functional test)

- **Status:** Gap; the current feature detects recurring charges from transactions but has no bill-create form, persistent bill record, or bill calendar.
- **Related source:** [`src/pages/Bills.tsx`](../src/pages/Bills.tsx) and [`supabase/functions/detect-bills/index.ts`](../supabase/functions/detect-bills/index.ts) implement recurring-charge detection only.
- **Attach for acceptance:** bill data model/create UI/calendar implementation and a functional-test record.

### AC-7.2

**Requirement:** Reminder is generated within the configured lead time before the due date (Verification: automated test)

- **Status:** Partial; the UI derives a fixed seven-day upcoming list, but there is no configured lead time or generated reminder.
- **Related source:** [`src/pages/Bills.tsx`](../src/pages/Bills.tsx#L54-L62) derives upcoming detected charges and [`src/pages/Bills.tsx`](../src/pages/Bills.tsx#L118-L141) displays them.
- **Attach for acceptance:** configurable reminder generation plus an automated time-boundary test.

### AC-7.3

**Requirement:** Marking a bill as paid updates its status and excludes it from active reminders (Verification: functional test)

- **Status:** Gap; no persistent bill status or mark-paid operation was found.
- **Attach for acceptance:** persisted paid-state implementation and a functional test proving removal from active reminders.

## 8. AI-Powered Financial Insights Engine

The supplied SOW extract ends immediately after this scope title. No acceptance criteria were supplied, so none can be mapped without inventing contractual wording. When the agreed criteria are provided, add their exact text to both this document and the README index before attaching evidence in Worql.

## Worql attachment checklist

For each criterion, attach the named test/review artifact in Worql and include:

- acceptance-criterion ID and exact requirement text;
- tested commit SHA and environment or review URL;
- test data/fixture identity and relevant configuration;
- command or procedure, timestamp, result, and measured values;
- screenshots/logs where the verification method calls for them;
- reviewer/client written sign-off.

Do not treat a source-code link alone as proof of a performance, timing, security, deployment, monitoring, or end-to-end behavior claim.
