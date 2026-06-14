# Uh-Huh Runtime Web Demo

Polished public web demo for Uh-Huh Runtime V0.1.

This is a standalone Next.js demo for Vercel. It does not replace the Python CLI runtime; the Python implementation remains the reference prototype.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- No database
- No auth
- No external API

## Local Development

From the repository root:

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01\web
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## Build

```powershell
cd C:\Users\mjhin\uh_huh_runtime_v01\web
npm.cmd run build
```

## Vercel Deployment

1. Push this repository to GitHub.
2. Go to Vercel and choose **Add New Project**.
3. Import the GitHub repository.
4. Set the project root directory to:

```text
web
```

5. Keep the default framework preset: **Next.js**.
6. Build command:

```text
npm run build
```

7. Output directory:

```text
.next
```

8. Deploy on the Vercel Hobby plan.

## Demo Flow

The web demo preserves the V0.1 flow:

```text
Action -> Control Gap -> Question -> Evidence -> Decision
```

Scenarios:

1. Recovery Ownership Gap
2. Ownership Evidence Present
3. After-Hours Production Change

The browser implementation ports only the current V0.1 evaluation logic to TypeScript for demonstration purposes.
