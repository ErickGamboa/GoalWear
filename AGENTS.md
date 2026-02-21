# AGENTS.md - GoalWear

AI coding agent instructions for this Next.js e-commerce project.

## Build Commands

```bash
# Development server (default: http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

**Note**: No test framework is configured. To add tests, use Vitest with React Testing Library.

## Project Overview

- **Framework**: Next.js 14.2+ with App Router
- **Language**: TypeScript 5.7+ (strict mode enabled)
- **UI**: shadcn/ui + Tailwind CSS 3.4
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **State**: React Context (CartProvider in `lib/cart-context.tsx`)
- **Currency**: Costa Rican Colón (₡) - use `formatCurrency()` from `@/lib/utils`

## Design System

- **Theme**: Monochrome black & white palette
- **CSS Variables**: Defined in `app/globals.css` - use semantic tokens (`foreground`, `background`, `muted`, etc.)
- **Transitions**: Modern, smooth animations (300-700ms with ease-out)
- **Border Radius**: Consistent rounded corners (use `rounded-xl`, `rounded-2xl`, `rounded-full`)

## Code Style Guidelines

### Imports

Order: React/Next → External libs → Internal (@/*) → Relative

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
3. **Exports**: Named exports preferred; use `React.forwardRef` for UI components
4. **Props Interface**: Use `interface` not `type` for component props

```typescript
"use client"

import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return <button ref={ref} className={cn("base-classes", className)} {...props} />
  }
)
Button.displayName = "Button"
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard` |
| Files | kebab-case | `product-card.tsx` |
| Hooks | camelCase with "use" | `useCart` |
| Types/Interfaces | PascalCase | `Product`, `CartItem` |
| Constants | UPPER_SNAKE_CASE | `CATEGORY_LABELS` |
| Server Actions | kebab-case | `patch-actions.ts` |

### Styling with Tailwind

1. Use `cn()` utility from `@/lib/utils` for conditional classes
2. Order: Layout → Spacing → Sizing → Typography → Colors → Effects → Transitions
3. Responsive: Mobile-first (default) → `md:` → `lg:`
4. Transitions: Always specify duration (e.g., `duration-300`, `duration-500`)

```tsx
className={cn(
  "flex items-center gap-2 rounded-xl px-4 py-2",
  "text-sm font-medium text-foreground",
  "transition-all duration-300",
  "hover:bg-foreground hover:text-background",
  className
)}
```

### TypeScript

1. **Strict mode enabled** - avoid `any` types
2. **Null checks**: Always handle `null`/`undefined` from Supabase with `?? []` or `?? null`
3. **Type imports**: Use `import type { ... }` for type-only imports
4. **Type definitions**: Centralized in `lib/types.ts`

```typescript
// Supabase data handling
const { data, error } = await supabase.from("products").select("*")
if (error) return null
return (data ?? []) as Product[]
```

### Error Handling

1. **Server Components**: Check for errors, log them, return null or empty arrays
2. **Client Components**: Use try/catch with `toast()` from sonner for user feedback
3. **Forms**: Use Zod schemas with React Hook Form's resolver

```typescript
// Client component with toast
try {
  await someAsyncOperation()
  toast.success("Operation successful")
} catch (err) {
  toast.error("Operation failed")
}
```

### Supabase Patterns

| Context | Import | Usage |
|---------|--------|-------|
| Client (browser) | `@/lib/supabase/client` | `createClient()` - synchronous |
| Server (SSR) | `@/lib/supabase/server` | `await createClient()` - async |

```typescript
// Client component
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()

// Server component
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()
```

### Form Handling

1. Define Zod schema for validation
2. Use `useForm` with `zodResolver`
3. Use shadcn/ui Form components for consistent styling

```typescript
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
})
```

## File Organization

```
app/
  (store)/              # Public store routes (customers)
    catalogo/           # Product catalog
    checkout/           # Checkout flow
    layout.tsx          # Store layout wrapper
  admin/                # Admin dashboard routes
    (dashboard)/        # Protected admin pages
    login/              # Admin authentication
  api/                  # API routes
  globals.css           # Global styles + CSS variables
  layout.tsx            # Root layout
components/
  ui/                   # shadcn/ui components (auto-generated)
  [feature].tsx         # Feature components (e.g., product-card.tsx)
lib/
  utils.ts              # cn(), formatCurrency()
  types.ts              # TypeScript type definitions
  cart-context.tsx      # Shopping cart React Context
  supabase/             # Supabase client configuration
hooks/
  use-[name].ts         # Custom React hooks
public/                 # Static assets
scripts/                # SQL migrations
```

## Important Notes

- **Images**: Unoptimized in `next.config.mjs` for static export compatibility
- **Language**: UI text in Spanish, code/comments in English
- **Environment**: Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **No ESLint config**: Uses Next.js defaults
- **Build errors**: TypeScript errors are ignored during build (`ignoreBuildErrors: true`)
