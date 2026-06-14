# Uh-Huh Runtime Web Console

Next.js demo for Uh-Huh Runtime V0.2: Functional Testable Console.

This web app is a local, deterministic demo. It does not use a database, auth, external APIs, integrations, or model calls.

## Local Development

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01\web
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## Production Build

Build:

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01\web
npm.cmd run build
```

Run the production build locally:

```powershell
npm.cmd run start
```

Open:

```text
http://localhost:3000
```

Important: `npm.cmd run build` does not start the app. Use `npm.cmd run dev` for development or `npm.cmd run start` after a production build.

## Runtime Parity Check

The TypeScript runtime is checked against the shared recovery ownership scenarios:

```powershell
npm.cmd run test:runtime
```

Fixture:

```text
..\test_scenarios\recovery_ownership_cases.json
```

## Vercel Deployment

1. Push the repository to GitHub.
2. In Vercel, import the repository.
3. Set **Root Directory** to:

```text
web
```

4. Use the default Next.js framework preset.
5. Build command:

```text
npm run build
```

6. Output:

```text
default Next.js output
```

No environment variables are required.

## Demo Behavior

The console supports:

- Recovery Ownership Gap
- Ownership Evidence Present
- After-Hours Production Change
- Custom Action

The runtime behavior is intentionally narrow:

- non-production action -> allow
- production missing recovery evidence -> ask
- production with recovery evidence -> allow
- production after-hours + low reversibility + missing evidence -> escalate

Advanced JSON is hidden by default. Rule trace and audit preview are visible for user testing.
