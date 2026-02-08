# AGENTS.md - GoalWear

AI coding agent instructions for this Next.js e-commerce project.

## Build Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

**Note**: No test framework is configured yet. To add tests, use Jest or Vitest with React Testing Library.

## Project Overview

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5.7+
- **UI**: shadcn/ui + Tailwind CSS 3.4
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **State**: React Context (CartProvider in lib/cart-context.tsx)

## Code Style Guidelines

### Imports

1. **Order**: React/Next → External libs → Internal (@/*) → Relative
2. **Use path aliases**: `@/components`, `@/lib`, `@/hooks`
3. **Type imports**: Use `import type { ... }` for types

```typescript
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"
```

### Component Structure

1. **Server Components** (default): No directive needed
2. **Client Components**: Add `"use client"` at the very top
3. **Exports**: Named exports for components, interfaces in same file
4. **Props Interface**: Use `interface` not `type` for component props

```typescript
"use client"  // If needed

import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return <button ref={ref} className={cn("...", className)} {...props} />
  }
)
Button.displayName = "Button"
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ProductCard`)
- **Files**: kebab-case (e.g., `product-card.tsx`)
- **Hooks**: camelCase starting with "use" (e.g., `useCart`)
- **Types/Interfaces**: PascalCase (e.g., `Product`, `CartItem`)
- **Constants**: UPPER_SNAKE_CASE for module-level constants

### Styling with Tailwind

1. **Use `cn()` utility** for conditional classes (from `@/lib/utils`)
2. **Order**: Layout → Spacing → Sizing → Typography → Colors → Effects
3. **Variables**: Use CSS custom properties from globals.css
4. **Responsive**: Mobile-first (default) → `md:` → `lg:`

```tsx
className={cn(
  "flex items-center gap-2 rounded-md px-4 py-2",
  "text-sm font-medium text-foreground",
  "hover:bg-accent hover:text-accent-foreground",
  className
)}
```

### TypeScript

1. **Strict mode enabled** - no `any` types
2. **Explicit return types** on exported functions
3. **Use `satisfies`** for better type inference when needed
4. **Null checks**: Always handle `null`/`undefined` from Supabase

```typescript
// Good
const products = (data ?? []) as Product[]

// Bad
const products = data as Product[]
```

### Error Handling

1. **Supabase**: Always check for errors and handle null data
2. **Client Components**: Use try/catch with toast notifications
3. **Server Components**: Let errors bubble or return null

```typescript
// Server component pattern
const { data, error } = await supabase.from("products").select("*")
if (error) {
  console.error("Failed to fetch products:", error)
  return null
}
return (data ?? []) as Product[]
```

### Supabase Patterns

1. **Client**: Use `createClient()` from `@/lib/supabase/client` (browser)
2. **Server**: Use `createClient()` from `@/lib/supabase/server` (async, cookies)
3. **Types**: Import from `@/lib/types`

### Form Handling

1. Use React Hook Form with Zod resolver
2. Validation schemas in component or separate file
3. Display errors with shadcn/ui Form components

### shadcn/ui Components

1. Located in `components/ui/`
2. Use `cva` for variants following existing patterns
3. Forward refs properly with `React.forwardRef`
4. Re-export from `@/components/ui/[component]`

### File Organization

```
app/
  (store)/          # Public store routes
  admin/            # Admin dashboard routes
  api/              # API routes
  globals.css       # Global styles + CSS variables
  layout.tsx        # Root layout
components/
  ui/               # shadcn/ui components
  [feature].tsx     # Feature components
lib/
  utils.ts          # cn() and utilities
  types.ts          # TypeScript types
  cart-context.tsx  # React Context providers
  supabase/         # Supabase clients
hooks/
  use-[name].ts     # Custom React hooks
public/             # Static assets
```

### Important Notes

- **No tests configured** - add Jest/Vitest if needed
- **ESLint**: Uses Next.js default config
- **Images**: Unoptimized in next.config.mjs (static export compatible)
- **Language**: UI in Spanish (es), code in English
- **Environment**: Uses `.env.local` for Supabase credentials
