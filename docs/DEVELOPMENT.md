# Development Guide

## 🏗️ Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm, yarn, or bun package manager
- Git for version control
- Code editor (VS Code recommended)

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint

## 🔧 Development Workflow

### 1. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will be available at http://localhost:8080
```

### 2. Code Structure Guidelines

#### Component Organization
```
src/components/
├── ui/              # Reusable UI primitives (shadcn/ui)
├── Header.tsx       # Page-specific components
├── Hero.tsx
└── ...
```

#### Naming Conventions
- **Components**: PascalCase (`Header.tsx`, `ContactForm.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useSecurityHeaders.ts`)
- **Utilities**: camelCase (`utils.ts`)
- **Constants**: UPPER_SNAKE_CASE

#### Import Organization
```typescript
// External libraries
import React from 'react';
import { Button } from '@radix-ui/react-button';

// Internal utilities
import { cn } from '@/lib/utils';

// Internal components
import { Header } from '@/components/Header';

// Types
import type { ComponentProps } from 'react';
```

### 3. Styling Guidelines

#### Design System Usage
Always use design system tokens instead of hardcoded values:

```tsx
// ❌ Avoid hardcoded values
<div className="bg-blue-500 text-white" />

// ✅ Use design system tokens
<div className="bg-primary text-primary-foreground" />
```

#### Component Variants
Create variants for reusable components:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
    },
  }
);
```

### 4. TypeScript Best Practices

#### Component Props
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  loading = false,
  children,
  ...props
}) => {
  // Component implementation
};
```

#### Type Imports
```typescript
import type { Database } from '@/integrations/supabase/types';
import type { ComponentProps, ReactNode } from 'react';
```

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Responsive design across devices
- [ ] Form validation and submission
- [ ] Navigation and routing
- [ ] Performance on slow connections
- [ ] Accessibility with screen readers
- [ ] Cross-browser compatibility

### Code Quality Tools

#### ESLint Configuration
```bash
# Run linting
npm run lint

# Auto-fix linting issues
npm run lint -- --fix
```

#### TypeScript Checking
```bash
# Check types
npx tsc --noEmit
```

## 🔄 State Management

### React Query Usage
```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });
};
```

### Form State Management
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const ContactForm = () => {
  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  // Form implementation
};
```

## 🎨 Design System Development

### Adding New Color Tokens
1. Define in `src/index.css`:
```css
:root {
  --new-color: 210 40% 50%;
}
```

2. Add to `tailwind.config.ts`:
```typescript
colors: {
  'new-color': 'hsl(var(--new-color))',
}
```

### Creating New Components
1. Create component file in appropriate directory
2. Define prop interfaces with TypeScript
3. Use design system tokens for styling
4. Add variants using `class-variance-authority`
5. Export from appropriate index file

## 🔌 Supabase Integration

### Database Operations
```tsx
import { supabase } from '@/integrations/supabase/client';

// Select data
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

// Insert data
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: value }]);

// Update data
const { data, error } = await supabase
  .from('table_name')
  .update({ column: newValue })
  .eq('id', id);
```

### Authentication
```tsx
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

## 🐛 Debugging

### Browser Developer Tools
- Use React Developer Tools extension
- Monitor Network tab for API calls
- Check Console for errors and warnings
- Use Performance tab for optimization

### Supabase Debugging
- Check Supabase logs in dashboard
- Verify RLS policies if data access issues
- Test queries in SQL editor

### Common Issues

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for type errors
npx tsc --noEmit
```

#### Styling Issues
- Verify Tailwind classes are correct
- Check design system token usage
- Ensure CSS is being loaded properly

## 📋 Development Checklist

Before submitting code:
- [ ] Code follows TypeScript best practices
- [ ] Components use design system tokens
- [ ] No hardcoded values in styling
- [ ] Proper error handling implemented
- [ ] Responsive design tested
- [ ] Accessibility considerations addressed
- [ ] Performance optimized
- [ ] Code is properly documented

## 🔗 Useful Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)