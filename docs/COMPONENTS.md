# Component Documentation

## 📚 Component Library Overview

This project uses a comprehensive component system built on top of Radix UI primitives and styled with Tailwind CSS. All components follow consistent patterns and design system tokens.

## 🏗️ Architecture

### Component Hierarchy
```
components/
├── ui/              # Base UI components (shadcn/ui)
├── layout/          # Layout components
├── forms/           # Form-specific components
└── business/        # Business logic components
```

### Design System Integration
All components use semantic design tokens defined in:
- `src/index.css` - CSS custom properties
- `tailwind.config.ts` - Tailwind configuration

## 🧩 Core UI Components

### Button Component

**Location**: `src/components/ui/button.tsx`

```tsx
import { Button } from '@/components/ui/button';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="outline" size="lg">
  Large Outline Button
</Button>

// With loading state
<Button loading disabled>
  Loading...
</Button>
```

**Props**:
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'
- `asChild`: boolean - Render as child element
- `loading`: boolean - Show loading state

### Card Component

**Location**: `src/components/ui/card.tsx`

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    Card footer
  </CardFooter>
</Card>
```

### Input Component

**Location**: `src/components/ui/input.tsx`

```tsx
import { Input } from '@/components/ui/input';

<Input
  type="email"
  placeholder="Enter email"
  value={value}
  onChange={onChange}
/>
```

### Form Components

**Location**: `src/components/ui/form.tsx`

```tsx
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';

<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

## 🏢 Business Components

### Header Component

**Location**: `src/components/Header.tsx`

```tsx
import { Header } from '@/components/Header';

<Header />
```

**Features**:
- Responsive navigation
- Mobile menu with slide-out drawer
- Smooth scroll navigation
- Logo with background gradient
- Call-to-action buttons

**Structure**:
```tsx
const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex">
          {/* Navigation items */}
        </nav>
        
        {/* Mobile Navigation */}
        <Sheet>
          {/* Mobile menu */}
        </Sheet>
      </div>
    </header>
  );
};
```

### Hero Component

**Location**: `src/components/Hero.tsx`

```tsx
import { Hero } from '@/components/Hero';

<Hero />
```

**Features**:
- Animated background with network imagery
- Gradient text effects
- Multiple call-to-action buttons
- Responsive design with mobile optimization
- Smooth animations on load

**Key Elements**:
- Primary heading with gradient text
- Descriptive subtext
- "Get Started" and "Learn More" buttons
- Background image with overlay

### Services Component

**Location**: `src/components/Services.tsx`

```tsx
import { Services } from '@/components/Services';

<Services />
```

**Features**:
- Grid layout of service cards
- Interactive hover effects
- Icon integration with Lucide React
- Responsive grid (1-3 columns)
- Animated entrance effects

**Service Cards Include**:
- WiFi Solutions
- Network Infrastructure
- Access Point Installation
- Network Optimization

### About Component

**Location**: `src/components/About.tsx`

```tsx
import { About } from '@/components/About';

<About />
```

**Features**:
- Split layout with image and content
- Company statistics/highlights
- Professional imagery
- Responsive design

### Contact Component

**Location**: `src/components/Contact.tsx`

```tsx
import { Contact } from '@/components/Contact';

<Contact />
```

**Features**:
- Form validation with React Hook Form and Zod
- Input sanitization and validation
- Toast notifications for feedback
- Responsive form layout
- Professional contact information display

**Form Fields**:
- Name (required)
- Email (required, validated)
- Subject (required)
- Message (required, minimum length)

### Footer Component

**Location**: `src/components/Footer.tsx`

```tsx
import { Footer } from '@/components/Footer';

<Footer />
```

**Features**:
- Multi-column layout
- Company information
- Quick links
- Contact details
- Copyright information

## 🔧 Custom Hooks

### useSecurityHeaders

**Location**: `src/hooks/useSecurityHeaders.ts`

```tsx
import { useSecurityHeaders } from '@/hooks/useSecurityHeaders';

const MyComponent = () => {
  useSecurityHeaders();
  // Component implementation
};
```

**Purpose**: Applies security headers including CSP, X-Frame-Options, and other security policies.

### use-mobile

**Location**: `src/hooks/use-mobile.tsx`

```tsx
import { useIsMobile } from '@/hooks/use-mobile';

const MyComponent = () => {
  const isMobile = useIsMobile();
  
  return (
    <div>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
};
```

### use-toast

**Location**: `src/hooks/use-toast.ts`

```tsx
import { useToast } from '@/hooks/use-toast';

const MyComponent = () => {
  const { toast } = useToast();
  
  const showSuccess = () => {
    toast({
      title: "Success!",
      description: "Operation completed successfully.",
    });
  };
  
  const showError = () => {
    toast({
      title: "Error",
      description: "Something went wrong.",
      variant: "destructive",
    });
  };
};
```

## 🎨 Styling Guidelines

### Design System Tokens

```css
/* Color Variables (index.css) */
:root {
  --background: 220 23% 11%;
  --foreground: 213 31% 91%;
  --primary: 142 76% 36%;
  --primary-foreground: 355 7% 97%;
  /* ... more tokens */
}
```

### Component Styling Patterns

```tsx
// Use className utility for conditional styles
import { cn } from '@/lib/utils';

const MyComponent = ({ variant, className, ...props }) => {
  return (
    <div
      className={cn(
        "base-styles",
        {
          "variant-styles": variant === "special",
        },
        className
      )}
      {...props}
    />
  );
};
```

### Responsive Design

```tsx
// Mobile-first responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>

// Container with responsive padding
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

## 🧪 Component Testing

### Testing Patterns

```tsx
// Component testing example
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  
  it('applies variant classes correctly', () => {
    render(<Button variant="outline">Outline Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-input');
  });
});
```

## 📱 Mobile Optimization

### Responsive Components
All components are designed mobile-first with breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Touch-Friendly Interactions
- Minimum 44px touch targets
- Proper spacing for touch navigation
- Swipe gestures where appropriate

## ♿ Accessibility

### ARIA Implementation
```tsx
// Proper ARIA attributes
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="menu"
>
  Close
</button>

// Form accessibility
<label htmlFor="email">Email Address</label>
<input id="email" type="email" aria-describedby="email-error" />
<div id="email-error" role="alert">
  {error && error.message}
</div>
```

### Keyboard Navigation
- Tab order properly configured
- Focus indicators visible
- Keyboard shortcuts where appropriate
- Screen reader friendly

## 🔄 State Management Patterns

### Form State
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const MyForm = () => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      // Initial values
    },
  });
  
  return (
    <Form {...form}>
      {/* Form fields */}
    </Form>
  );
};
```

### Server State
```tsx
import { useQuery } from '@tanstack/react-query';

const MyComponent = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* Render data */}</div>;
};
```

## 📋 Component Checklist

When creating new components:

- [ ] TypeScript interfaces defined
- [ ] Design system tokens used
- [ ] Responsive design implemented
- [ ] Accessibility attributes added
- [ ] Props documented
- [ ] Default values provided
- [ ] Error boundaries considered
- [ ] Loading states handled
- [ ] Mobile optimization verified
- [ ] Cross-browser testing completed

---

For additional component examples and patterns, refer to the shadcn/ui documentation and the existing component implementations in the project.