# Local Development Setup Guide

## 🚀 Complete Project Export & Local Setup

This guide will help you set up the B-Spot Network Solutions project locally without Lovable's cloud services.

## 📁 Project Structure Export

Your project includes:

### Frontend Files
```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── Header.tsx       # Navigation header
│   ├── Hero.tsx         # Hero section
│   ├── Services.tsx     # Services showcase
│   ├── About.tsx        # About section
│   ├── Contact.tsx      # Contact form
│   └── Footer.tsx       # Site footer
├── hooks/               # Custom React hooks
├── integrations/        # Supabase integration
├── lib/                # Utility functions
├── pages/              # Page components
└── assets/             # Static assets

Configuration files:
├── package.json         # Dependencies
├── vite.config.ts      # Vite configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── eslint.config.js    # ESLint configuration
└── index.html          # Entry HTML file
```

### Backend/Database Files
```
supabase/
├── config.toml         # Supabase configuration
├── seed.sql           # Database seed data
└── migrations/        # Database migrations (if any)

.github/workflows/     # GitHub Actions for automation
docs/                  # Project documentation
```

## 🛠️ Local Development Setup

### Prerequisites

Install the following on your local machine:

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Git** - [Download](https://git-scm.com/)
3. **Supabase CLI** - `npm install -g supabase`
4. **PostgreSQL** (optional, for local database) - [Download](https://postgresql.org/)

### Step 1: Download Project Files

1. **GitHub Export**: If connected to GitHub, clone your repository:
   ```bash
   git clone [your-github-repo-url]
   cd [project-name]
   ```

2. **Manual Export**: Download all files from your Lovable project and organize them according to the project structure above.

### Step 2: Environment Configuration

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: For local Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# Development Configuration
NODE_ENV=development
VITE_DEV_MODE=true
```

### Step 3: Install Dependencies

```bash
# Install project dependencies
npm install

# Install Supabase CLI globally
npm install -g supabase
```

### Step 4: Database Setup Options

#### Option A: Use Existing Supabase Project
1. Keep your existing Supabase project running
2. Use the production URLs in your `.env.local`
3. No additional setup required

#### Option B: Local Supabase Setup
```bash
# Initialize Supabase in your project
supabase init

# Start local Supabase
supabase start

# This will start:
# - PostgreSQL database
# - Supabase API
# - Supabase Studio (dashboard)
# - Edge Functions runtime
```

#### Option C: Local PostgreSQL Setup
1. Install PostgreSQL locally
2. Create a new database:
   ```sql
   CREATE DATABASE bspot_network;
   ```
3. Import the schema (see Database Export section below)

### Step 5: Start Development Server

```bash
# Start the development server
npm run dev

# The app will be available at:
# http://localhost:8080
```

## 💾 Database Export & Import

### Schema Export

Current database schema:
```sql
-- Note: No custom tables found in current project
-- The project uses Supabase's built-in auth system
-- Add your custom tables here when created

-- Example for future reference:
-- CREATE TABLE IF NOT EXISTS public.contacts (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   name TEXT NOT NULL,
--   email TEXT NOT NULL,
--   message TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
-- );
```

### Data Export Commands

If you have data in your Supabase project:

```bash
# Export schema only
supabase db dump --schema-only > schema.sql

# Export data only
supabase db dump --data-only > data.sql

# Export both schema and data
supabase db dump > full_dump.sql
```

### Import to Local Database

#### For Local Supabase:
```bash
# Reset and apply migrations
supabase db reset

# If you have custom migrations
supabase migration up
```

#### For Local PostgreSQL:
```bash
# Import schema
psql -d bspot_network -f schema.sql

# Import data
psql -d bspot_network -f data.sql
```

## 🔧 Configuration Files

### package.json
Contains all project dependencies and scripts. Key dependencies:
- React 18.3.1
- TypeScript
- Vite (build tool)
- Tailwind CSS
- Supabase client
- shadcn/ui components

### vite.config.ts
Vite configuration with:
- React plugin
- Path aliases (@/ for src/)
- Development server on port 8080

### tailwind.config.ts
Custom design system with:
- Color tokens using HSL values
- Custom gradients and shadows
- Animation utilities
- Component variants

## 🎨 Design System

The project uses a custom design system defined in:

### src/index.css
Contains CSS custom properties for:
- Color palette (HSL values)
- Gradients and shadows
- Animations and transitions
- Component utilities

Key design tokens:
```css
--primary: 43 96% 56%;           /* Main brand color */
--background: 15 10% 8%;         /* Background */
--foreground: 45 15% 96%;        /* Text color */
--gradient-primary: linear-gradient(135deg, hsl(43, 96%, 56%), hsl(45, 100%, 72%));
```

## 🔐 Environment Variables Guide

### Required Variables
```env
# Supabase (Required)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional Development Variables
NODE_ENV=development
VITE_DEV_MODE=true
```

### Finding Your Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon public key

## 🚀 Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview

# The built files will be in the `dist/` directory
```

## 📱 Mobile Development

The project is responsive and works on mobile devices. For mobile app development:

1. Use the web app as a PWA
2. Consider Capacitor.js for native mobile apps
3. Or use React Native with shared components

## 🧪 Testing Setup

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix

# Type checking
npx tsc --noEmit
```

## 🔄 Deployment Options

Once running locally, you can deploy to:

### Static Hosting
- Vercel: `npm run build` → upload `dist/`
- Netlify: Connect GitHub repo
- GitHub Pages: Use GitHub Actions

### Container Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "preview"]
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 8080
npx kill-port 8080

# Or use different port
npm run dev -- --port 3000
```

#### Supabase Connection Issues
1. Check your environment variables
2. Verify Supabase project is running
3. Check network connectivity
4. Verify API keys are correct

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

#### Styling Issues
1. Ensure Tailwind CSS is configured properly
2. Check that design system tokens are imported
3. Verify CSS custom properties are defined

## 📞 Support

For additional help:
1. Check the [Development Guide](./DEVELOPMENT.md)
2. Review [Troubleshooting Guide](./TROUBLESHOOTING.md)
3. Check project documentation in `docs/`

## 📋 Local Development Checklist

- [ ] Node.js 18+ installed
- [ ] Project files downloaded/cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Database setup (Supabase or local)
- [ ] Development server running (`npm run dev`)
- [ ] Application accessible at http://localhost:8080

---

**Project Information:**
- Framework: React + Vite + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Backend: Supabase
- Current Supabase Project: rtgcrclgmvcmrjpvtpwm