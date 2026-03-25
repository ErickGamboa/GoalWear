# AGENTS.md - GoalWear

Instructions for coding agents working in this repository.

## Rule Files Detected

- Cursor rules: none found (`.cursor/rules/` and `.cursorrules` not present).
- Copilot rules: none found (`.github/copilot-instructions.md` not present).
- Follow this file and existing code patterns as the source of truth.

## Build, Lint, and Test Commands

Run all commands from the repo root.

```bash
# install dependencies
npm install

# development
npm run dev

# production build
npm run build

# production server
npm run start

# lint
npm run lint
```

### Tests (Current Status)

- There is no configured test runner and no `test` script in `package.json`.
- If tests are introduced, use Vitest commands below.

```bash
# run all tests
npx vitest run

# run one test file
npx vitest run path/to/file.test.tsx

# run one test name
npx vitest run -t "test name"

# watch one test file
npx vitest path/to/file.test.tsx
```

## Repo Layout

```text
app/
  (store)/               public storefront routes
  admin/(dashboard)/     protected admin routes
  admin/login/           admin auth page
  api/                   route handlers
components/
  ui/                    shadcn/ui primitives
lib/
  supabase/              client/server/middleware setup
  cart-context.tsx       cart state provider
  types.ts               shared domain types and constants
  utils.ts               cn() and formatCurrency()
middleware.ts            auth/session gate for admin routes
```

## Code Style and Formatting

- Keep diffs minimal and scoped to the requested task.
- Preserve local style in each file (quotes and spacing are mixed today).
- Prefer 2-space indentation and semicolon-free style where consistent.
- Avoid unrelated formatting churn.
- Add comments only for non-obvious logic.
- Do not add dependencies unless clearly necessary.

## Imports

Use this order with one blank line between groups:

1. React / Next imports
2. External packages
3. Internal alias imports (`@/...`)
4. Relative imports (`./`, `../`)

Import rules:

- Use `import type` for type-only imports.
- Prefer named exports in app code.
- Prefer `@/*` aliases over deep relative paths.

## TypeScript Guidelines

- Keep strict typing; avoid `any` whenever possible.
- Use `unknown` and narrow when needed.
- Put shared domain types in `lib/types.ts`.
- Handle nullable Supabase responses explicitly (`?? []`, `?? null`).
- Validate user input at boundaries (forms and API routes).

## Next.js and React Patterns

- Default to Server Components; add `"use client"` only when needed.
- Use `"use server"` in server action modules.
- Keep route files focused on composition and data loading.
- Keep interactive/stateful logic in client components.
- Revalidate relevant routes after writes using `revalidatePath`.

## Supabase Conventions

- Browser usage: `createClient()` from `@/lib/supabase/client`.
- Server usage: `await createClient()` from `@/lib/supabase/server`.
- Do not create global server-side Supabase clients.
- Always check `{ error }` before consuming `data`.
- Use existing auth middleware flow in `middleware.ts`.

## Error Handling

- Wrap async client submissions in `try/catch/finally`.
- Show user-facing errors with `toast.error(...)`.
- Log actionable server errors with context.
- Return consistent JSON and HTTP status codes from API routes.
- Fail fast on missing required input.

## Naming Conventions

- Components/types/interfaces: PascalCase (`ProductCard`, `OrderWithItems`).
- Files: kebab-case (`product-card.tsx`, `patch-actions.ts`).
- Hooks/utils: camelCase (`useCart`, `formatCurrency`).
- Constants: UPPER_SNAKE_CASE (`CATEGORY_LABELS`).
- Server action files: kebab-case, often `*-actions.ts`.

## Tailwind and UI Guidelines

- Use semantic tokens from `app/globals.css` (`background`, `foreground`, `muted`).
- Keep the existing monochrome aesthetic.
- Use `cn()` from `@/lib/utils` for conditional classes.
- Use mobile-first responsive classes (`md:`, `lg:`).
- Include explicit transition durations for animated UI.

## Domain Rules

- UI copy is Spanish; code and comments are English.
- Currency is Costa Rican colon; format with `formatCurrency()`.
- Product category and sport mappings come from `lib/types.ts` constants.
- Adult sizes: `S, M, L, XL, 2XL, 3XL, 4XL`.
- Kids sizes are stored as text; UI labels use format like `XXS = 16`.

## Environment and Runtime Notes

- Required `.env.local` vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `next.config.mjs` has `images.unoptimized = true`.
- `next.config.mjs` has `typescript.ignoreBuildErrors = true`.
  - Treat as temporary safety net; still fix TS issues in changed code.

## Agent Checklist

- Read nearby files before editing and follow local patterns.
- Reuse existing UI primitives and domain constants when possible.
- Run `npm run lint` before finishing; run `npm run build` for route/type/runtime-impacting changes.
- If tests exist, run targeted single-file tests and report exact command used.
