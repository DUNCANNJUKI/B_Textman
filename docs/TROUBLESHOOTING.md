# Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Development Environment

#### Port Already in Use
```bash
# Error: Port 8080 is already in use
# Solution: Kill the process or use a different port

# Find process using port 8080
lsof -ti:8080

# Kill the process
kill -9 $(lsof -ti:8080)

# Or use a different port
npm run dev -- --port 3000
```

#### Node Version Issues
```bash
# Error: Node version compatibility
# Solution: Use Node.js 18.x or higher

# Check current version
node --version

# Using nvm to switch versions
nvm install 18
nvm use 18
```

#### Package Installation Failures
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If using different package managers
# For yarn
rm -rf node_modules yarn.lock
yarn install

# For bun
rm -rf node_modules bun.lockb
bun install
```

### Build Issues

#### TypeScript Compilation Errors

**Issue**: Type errors preventing build
```typescript
// Common error: Property does not exist on type
// Solution: Check import paths and type definitions

// ❌ Incorrect import
import { Button } from 'components/ui/button';

// ✅ Correct import
import { Button } from '@/components/ui/button';
```

**Issue**: Missing type definitions
```bash
# Install missing type definitions
npm install @types/node @types/react @types/react-dom
```

**Issue**: Strict mode TypeScript errors
```typescript
// Error: Object is possibly 'null' or 'undefined'
// Solution: Add null checks

// ❌ Unsafe
document.getElementById('root').render(<App />);

// ✅ Safe
const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.render(<App />);
}
```

#### Vite Build Issues

**Issue**: Memory allocation errors
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Issue**: Import path resolution
```typescript
// Verify vite.config.ts alias configuration
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Styling Problems

#### Tailwind CSS Not Working

**Issue**: Styles not applying
```bash
# Check if Tailwind is properly configured
# Verify tailwind.config.ts includes all content paths

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
}
```

**Issue**: Custom CSS not loading
```typescript
// Ensure index.css is imported in main.tsx
import './index.css';
```

**Issue**: Dark mode not working
```typescript
// Check if ThemeProvider is properly configured
import { ThemeProvider } from 'next-themes';

// Wrap app with ThemeProvider
<ThemeProvider attribute="class" defaultTheme="dark">
  <App />
</ThemeProvider>
```

#### Design System Token Issues

**Issue**: Colors not displaying correctly
```css
/* Verify CSS custom properties are defined */
:root {
  --primary: 142 76% 36%; /* HSL values without hsl() */
}

/* Use in Tailwind */
.bg-primary {
  background-color: hsl(var(--primary));
}
```

### Component Issues

#### Radix UI Components Not Rendering

**Issue**: Missing Radix UI dependencies
```bash
# Install required Radix UI packages
npm install @radix-ui/react-dialog @radix-ui/react-button
```

**Issue**: Portal-related issues
```typescript
// Ensure proper portal configuration
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      {/* Content */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

#### Form Validation Issues

**Issue**: React Hook Form validation not working
```typescript
// Ensure schema is properly configured
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
});

const form = useForm({
  resolver: zodResolver(schema), // Don't forget this
});
```

**Issue**: Form submission not working
```typescript
// Check form submission handler
const onSubmit = (data: FormData) => {
  console.log('Form data:', data); // Debug log
  // Handle submission
};

<form onSubmit={form.handleSubmit(onSubmit)}>
  {/* Form fields */}
</form>
```

### Supabase Integration Issues

#### Connection Problems

**Issue**: Supabase client not connecting
```typescript
// Verify client configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Issue**: Authentication not working
```typescript
// Check authentication flow
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

if (error) {
  console.error('Auth error:', error.message);
}
```

#### Database Query Issues

**Issue**: RLS policies blocking queries
```sql
-- Check RLS policies in Supabase dashboard
-- Ensure policies allow the intended access

-- Example policy for user-specific data
CREATE POLICY "Users can view their own data" 
ON public.user_data 
FOR SELECT 
USING (auth.uid() = user_id);
```

**Issue**: Query syntax errors
```typescript
// Common query patterns
// ❌ Incorrect
const { data } = await supabase
  .from('users')
  .select('name, email')
  .eq('id', userId);

// ✅ Correct
const { data, error } = await supabase
  .from('users')
  .select('name, email')
  .eq('id', userId)
  .single(); // If expecting single result

if (error) {
  console.error('Query error:', error);
}
```

### Performance Issues

#### Slow Loading Times

**Issue**: Large bundle size
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer

# Common solutions:
# 1. Lazy load routes
const LazyComponent = lazy(() => import('./Component'));

# 2. Code splitting
const { useState, useEffect } = await import('react');

# 3. Tree shaking
# Import only what you need
import { Button } from '@/components/ui/button'; // ✅
import * as UI from '@/components/ui'; // ❌
```

**Issue**: Memory leaks
```typescript
// Cleanup effect subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('table-changes')
    .on('postgres_changes', callback)
    .subscribe();

  return () => {
    subscription.unsubscribe(); // Important cleanup
  };
}, []);
```

### Mobile-Specific Issues

#### Touch Events Not Working
```typescript
// Use proper touch event handlers
<div
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
  style={{ touchAction: 'manipulation' }} // Prevent zoom on double-tap
>
  Touch me
</div>
```

#### Viewport Issues
```html
<!-- Ensure proper viewport meta tag -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

#### iOS Safari Specific Issues
```css
/* Fix iOS Safari 100vh issue */
.full-height {
  height: 100vh;
  height: -webkit-fill-available;
}

/* Prevent zoom on input focus */
input {
  font-size: 16px; /* Minimum 16px to prevent zoom */
}
```

## 🔧 Debugging Tools

### Browser Developer Tools

#### Console Debugging
```javascript
// Enable React DevTools
window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot

// Debug component re-renders
console.log('Component rendered:', { props, state });

// Debug API calls
console.log('API Request:', { url, params, response });
```

#### Network Tab
- Monitor API calls to Supabase
- Check for failed requests
- Verify response data structure
- Monitor loading times

#### Performance Tab
- Identify performance bottlenecks
- Monitor memory usage
- Check for unnecessary re-renders

### React-Specific Debugging

#### React Developer Tools
```javascript
// Install React DevTools browser extension
// Use Profiler to identify performance issues
// Use Components tab to inspect props and state
```

#### Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

## 📋 Debugging Checklist

When encountering issues:

### Initial Steps
- [ ] Check browser console for errors
- [ ] Verify all dependencies are installed
- [ ] Ensure environment variables are set
- [ ] Check network requests in DevTools
- [ ] Verify file paths and imports

### Build Issues
- [ ] Clear cache and reinstall dependencies
- [ ] Check TypeScript configuration
- [ ] Verify Vite configuration
- [ ] Test with different Node.js version

### Runtime Issues
- [ ] Check component props and state
- [ ] Verify API endpoints and responses
- [ ] Test with different browsers
- [ ] Check mobile device compatibility

### Performance Issues
- [ ] Analyze bundle size
- [ ] Check for memory leaks
- [ ] Monitor re-render frequency
- [ ] Optimize image and asset loading

## 🆘 Getting Help

### Resources
- [React Documentation](https://react.dev/learn)
- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community Support
- Stack Overflow with relevant tags
- GitHub Issues for specific packages
- Discord communities for React and Supabase
- Reddit communities (r/reactjs, r/webdev)

### Creating Bug Reports
When reporting issues, include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and version
- Console error messages
- Minimal code example
- Environment details (Node version, OS, etc.)

---

For issues not covered in this guide, please check the project's GitHub issues or create a new issue with detailed reproduction steps.