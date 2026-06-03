# Auth Security Review

**Last audited:** 2026-06-03  
**Auditor:** auth-auditor agent  
**Scope:** NextAuth v5 credentials + GitHub provider, email verification, password reset, profile page

---

## Critical

<!-- Severity: can be exploited remotely with no auth, leads to account takeover / data breach -->

### Production secrets committed to the repository (or present in working tree)

**File:** `.env:1-5` and `.env.production:1-5`  
**Issue:** Both `.env` and `.env.production` contain real, active credentials — a Neon PostgreSQL connection string (including username and password), `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `RESEND_AI_KEY`. Although the current `.gitignore` contains `.env*` and these files do not appear to be tracked in git right now, the secrets are live values stored in plaintext files on disk. If either file was ever committed, or if the repo is pushed to a remote, these credentials are exposed. The Neon DATABASE_URL grants direct database access; `AUTH_GITHUB_SECRET` allows impersonating the OAuth app; `AUTH_SECRET` allows forging signed NextAuth JWT tokens (full account takeover without a password).  
**Fix:**  
1. Rotate all exposed secrets immediately: regenerate the Neon password, roll the GitHub OAuth secret, generate a new `AUTH_SECRET` (`openssl rand -base64 32`), and revoke/reissue the Resend API key.  
2. Confirm `.env` and `.env.production` are not present in git history (`git log --all --full-history -- .env`). If they appear, purge the history with `git filter-repo`.  
3. Store secrets in the deployment platform's secret manager (Vercel Environment Variables, AWS Secrets Manager, etc.) — never in files that live in the project tree.  
4. Add a pre-commit hook (e.g. `detect-secrets` or `gitleaks`) to prevent future accidental commits of secrets.

---

## High

<!-- Severity: significant security weakness, requires some conditions to exploit -->

### No rate limiting on any authentication endpoint

**File:** `src/app/api/auth/register/route.ts` (registration), `src/actions/password-reset.ts` (forgot-password / reset-password), `src/auth.ts` (sign-in via NextAuth credentials)  
**Issue:** None of the authentication endpoints apply rate limiting. This means:
- The registration endpoint (`POST /api/auth/register`) can be hammered to enumerate valid email addresses (HTTP 409 vs 400/201 differ by address existence) and to flood the Resend quota.
- The forgot-password action (`requestPasswordReset`) can be called in a tight loop to spam a target's inbox and exhaust the Resend sending limit.
- The credentials sign-in endpoint has no throttle, enabling unlimited password-guessing (brute-force) attacks against any known email address.  
**Fix:** Add a lightweight rate limiter. For Next.js Route Handlers and Server Actions use `@upstash/ratelimit` + `@upstash/redis` (edge-compatible) or the `rate-limiter-flexible` package with Redis. Apply limits per IP and, for password-reset, additionally per email address. Recommended limits: sign-in 5 attempts / 15 min per IP, register 10 / hour per IP, forgot-password 3 / hour per email.

---

### Registration endpoint lacks server-side password length validation

**File:** `src/app/api/auth/register/route.ts:10-16`  
**Issue:** The `POST /api/auth/register` handler checks that `password` and `confirmPassword` are present and match, but it does **not** enforce a minimum password length server-side. The `minLength={8}` constraint in the register page form (`src/app/(auth)/register/page.tsx`) is a client-side HTML attribute only — it is trivially bypassed by sending a raw `POST` request. A password as short as one character will be bcrypt-hashed and stored.  
**Fix:** Add a server-side length check before hashing, consistent with the rest of the codebase:
```ts
if (password.length < 8) {
  return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 })
}
```

---

### Registration endpoint lacks server-side email format validation

**File:** `src/app/api/auth/register/route.ts:10-16`  
**Issue:** The client-side form uses `type="email"` and a regex check (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) to validate the email format, but the Route Handler does not validate the email format at all. Malformed values (e.g. empty string, whitespace, or strings without `@`) that bypass the HTML form will be passed directly to `prisma.user.findUnique` and, if no match, to `prisma.user.create`. This can lead to junk records in the database and potentially unexpected Prisma/DB behaviour.  
**Fix:** Validate the email server-side before any DB query. Zod is already listed as a project dependency. A minimal guard:
```ts
import { z } from 'zod'
const emailSchema = z.string().email()
if (!emailSchema.safeParse(email).success) {
  return Response.json({ error: "Invalid email address" }, { status: 400 })
}
```

---

## Medium

<!-- Severity: defence-in-depth gap, low exploitability in isolation -->

### Delete account action has no password re-confirmation

**File:** `src/actions/profile.ts:45-52`, `src/components/profile/DeleteAccountButton.tsx`  
**Issue:** The `deleteAccount` server action is protected by a session check (`auth()`), which is correct. However, it performs the permanent deletion after only a two-click UI confirmation — there is no re-entry of the current password before the irreversible action executes. If an attacker gains access to an authenticated browser session (e.g. via XSS, a shared device, or a stolen session cookie), they can delete the account with two clicks and no further credential challenge.  
**Fix:** Require the user to type their current password into the confirmation dialog before `deleteAccount` is called. Pass the password to the server action, verify it with `bcrypt.compare` against the stored hash (the same pattern used in `changePassword`), and only proceed with deletion if the check passes. For OAuth-only accounts (where `hasPassword` is false), require the user to type their email address instead as a confirmation gate.

---

### Email verification flow allows re-verification of an already-verified token via timing window

**File:** `src/app/(auth)/verify-email/page.tsx:13-29`  
**Issue:** The verification page reads the token with `findUnique`, checks expiry, updates the user, then deletes the token with `deleteMany`. These are three separate, non-atomic Prisma operations. In a concurrent scenario (e.g. the user double-clicks the link or the link is accessed simultaneously by a browser pre-fetcher), the token could be consumed twice between the `findUnique` and the `deleteMany`. While the real-world impact is low (the user is just verified again to the same state), it represents a race condition in token invalidation.  
**Fix:** Wrap the read-update-delete sequence in a Prisma `$transaction`, or delete the token first and check the deletion count (if `count === 0`, the token was already used):
```ts
const deleted = await prisma.verificationToken.deleteMany({ where: { token } })
if (deleted.count === 0) {
  return <VerifyResult error="This verification link is invalid or has already been used." />
}
// Now safe to update the user
```

---

### `requestPasswordReset` constructs the reset URL from the `Host` header

**File:** `src/actions/password-reset.ts:31-33`  
**Issue:** The reset URL is built from `headers().get('host')`, which is a user-controlled HTTP header. While Server Actions have CSRF protection, if this action is ever reachable via a misconfigured reverse proxy or a forwarded request where the `Host` header is attacker-supplied, the generated reset URL would point to an attacker-controlled domain. The email would then contain a link like `https://evil.example.com/reset-password?token=...`, causing the victim's reset token to be submitted to the attacker's server.  
**Fix:** Source the application's base URL from a trusted environment variable (`NEXTAUTH_URL` or a dedicated `APP_URL`):
```ts
const baseUrl = process.env.NEXTAUTH_URL ?? `https://${headersList.get('host')}`
```

---

## Low

<!-- Severity: minor hardening opportunity -->

### Resend API key environment variable has an unexpected name (`RESEND_AI_KEY`)

**File:** `src/lib/resend.ts:3`  
**Issue:** The Resend client is initialised with `process.env.RESEND_AI_KEY`. The conventional name for this variable is `RESEND_API_KEY`. The name `RESEND_AI_KEY` is unusual and could cause confusion for developers setting up the project, potentially leading to an accidentally undefined key (Resend client instantiated with `undefined`). When the key is `undefined`, Resend silently constructs the client without failing at startup — the error only surfaces at send time.  
**Fix:** Rename the environment variable to `RESEND_API_KEY` in `src/lib/resend.ts`, both `.env` files, and any deployment configuration. Add a startup assertion to fail fast if the value is missing:
```ts
if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
export const resend = new Resend(process.env.RESEND_API_KEY)
```

---

### `AUTH_SECRET` is identical between development and production environments

**File:** `.env:2`, `.env.production:2`  
**Issue:** Both `.env` and `.env.production` use the same `AUTH_SECRET` value. Sharing the secret across environments means that a JWT signed in the development environment is valid in production and vice versa. If a development token is leaked, it can be used to forge authenticated sessions in production.  
**Fix:** Generate a separate, unique `AUTH_SECRET` for each environment (`openssl rand -base64 32`) and store each exclusively in its respective environment's secret manager.

---

### `proxy.ts` route-guard exports are named `proxy` / `config` instead of `middleware` / `config`

**File:** `src/proxy.ts:7,19`  
**Issue:** Next.js middleware must be exported as the default export from `src/middleware.ts` (or as a named `middleware` export). The file is named `proxy.ts` and exports `proxy` (not `middleware`). This means the route guard currently relies on being imported and invoked elsewhere, which may be fragile. If the import chain is broken, the guard silently stops running and `/dashboard` and `/profile` become publicly accessible without authentication.  
**Fix:** Rename `src/proxy.ts` to `src/middleware.ts` and change the export name to `middleware` to match the Next.js middleware convention, ensuring it is automatically picked up by the framework regardless of import chains.

---

## Passed Checks

- **Password hashing algorithm** (`src/auth.ts:4`, `src/app/api/auth/register/route.ts:4`, `src/actions/profile.ts:3`, `src/actions/password-reset.ts:3`): `bcryptjs` is imported and used for all password operations — no weak algorithms (MD5, SHA1, SHA256) present.

- **Bcrypt salt rounds** (`src/app/api/auth/register/route.ts:23`, `src/actions/profile.ts:36`, `src/actions/password-reset.ts:70`): All `bcrypt.hash()` calls use 12 rounds, exceeding the minimum recommended value of 10.

- **Plaintext password exposure** (all audited files): No plaintext passwords are logged, returned in responses, or stored. Only bcrypt hashes are persisted. The verify-URL and reset-URL are logged in development mode only (not passwords).

- **Current password verification before change** (`src/actions/profile.ts:31-33`): `changePassword` fetches the stored hash and calls `bcrypt.compare(currentPassword, user.password)` before hashing and saving the new password.

- **Verification token entropy** (`src/app/api/auth/register/route.ts:36`): Tokens are generated with `randomBytes(32).toString('hex')` — 256 bits of cryptographic randomness, well above the recommended minimum.

- **Reset token entropy** (`src/actions/password-reset.ts:24`): Same as above — `randomBytes(32).toString('hex')`.

- **Verification token expiry stored and checked** (`src/app/api/auth/register/route.ts:37-38`, `src/app/(auth)/verify-email/page.tsx:20`): Expiry is stored as a `DateTime` field in the `VerificationToken` table and checked (`record.expires < new Date()`) before accepting the token.

- **Reset token expiry stored and checked** (`src/actions/password-reset.ts:25`, `src/actions/password-reset.ts:64`): 1-hour expiry is stored in the DB and validated before the reset is applied.

- **Verification token invalidated after use** (`src/app/(auth)/verify-email/page.tsx:29`): `deleteMany({ where: { token } })` is called immediately after the user record is updated.

- **Reset token single-use enforcement** (`src/actions/password-reset.ts:77`): Token is deleted via `deleteMany({ where: { token } })` immediately after a successful password reset.

- **Old verification token invalidated on re-request** (by design): Registration creates a new user with a new token each time; re-registration to the same email returns a 409 conflict, so re-issuance is not applicable. The flow does not offer a "resend verification email" button, so there is no re-request path to audit.

- **Old reset token invalidated on re-request** (`src/actions/password-reset.ts:20-22`): Before creating a new reset token, `deleteMany({ where: { identifier: IDENTIFIER_PREFIX + email } })` removes any existing token for that email.

- **Email enumeration prevention on forgot-password** (`src/actions/password-reset.ts:11-17`, `src/app/(auth)/forgot-password/page.tsx:30-43`): The action always returns `{ success: true }` regardless of whether the email exists; the UI always shows the "check your email" message.

- **Password length validation on reset** (`src/actions/password-reset.ts:54-56`): `password.length < 8` is checked server-side before the hash is written.

- **Password length validation on change** (`src/actions/profile.ts:18-20`): `newPassword.length < 8` is checked server-side.

- **Session check on profile / password-change** (`src/actions/profile.ts:8-13`, `src/app/(dashboard)/profile/page.tsx:11-12`): Both the server action and the page call `auth()` and check `session?.user?.id`, redirecting or returning an error if unauthenticated.

- **Session ID used to scope DB writes** (`src/actions/profile.ts:22`, `src/actions/profile.ts:38`, `src/actions/profile.ts:49`): All DB operations use `session.user.id` sourced from the server-side session token — no user-supplied ID is accepted from the request body.

- **`AUTH_SECRET` sourced from environment variable** (`src/auth.ts`): NextAuth is initialised without a hardcoded secret; the framework reads `AUTH_SECRET` from the environment automatically.

- **GitHub OAuth secrets sourced from environment variables** (`src/auth.ts:2`, `src/auth.config.ts:2`): The `GitHub` provider is instantiated without explicit credential arguments, relying on the framework's convention of reading `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` from the environment.

- **`DATABASE_URL` not hardcoded in source** (`src/lib/prisma.ts`): Prisma reads `DATABASE_URL` from the environment; it is not present in any source file.

- **No hardcoded secrets in audited source files**: A search of all `.ts` / `.tsx` source files found no API keys, connection strings, or secrets embedded in code.
