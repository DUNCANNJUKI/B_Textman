import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Rajdhani', 'Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)', 
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-elegant': 'var(--gradient-elegant)',
        'gradient-mesh': 'var(--gradient-mesh)',
      },
      boxShadow: {
        'tech-glow': 'var(--tech-glow)',
        'card-shadow': 'var(--card-shadow)',
        'elegant-shadow': 'var(--elegant-shadow)',
        'premium-shadow': 'var(--premium-shadow)',
      },
      animation: {
        'tech-glow': 'tech-glow 3s ease-in-out infinite alternate',
        'color-shift': 'colorShift 4s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'letter-glow': 'letterGlow 2s ease-in-out infinite alternate',
        'matrix-scan': 'matrix-scan 4s ease-in-out infinite',
        'digital-flicker': 'digitalFlicker 0.1s linear infinite',
        'network-pulse': 'networkPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal-wave': 'signalWave 3s ease-in-out infinite',
        'data-flow': 'dataFlow 4s linear infinite',
        'avatar-glow': 'avatarGlow 2s ease-in-out infinite alternate',
        'circuit-flow': 'circuitFlow 3s linear infinite',
        'swing': 'swing 6s ease-in-out infinite',
        'spin-slow': 'spin 4s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'text-shimmer': 'textShimmer 3s linear infinite',
        'blink': 'blink 1s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0.2' },
          '50%': { transform: 'translateY(-10px) scale(1.02)', opacity: '0.3' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px hsl(var(--primary) / 0.3), 0 0 10px hsl(var(--primary) / 0.2)' },
          '50%': { boxShadow: '0 0 15px hsl(var(--primary) / 0.5), 0 0 25px hsl(var(--primary) / 0.3)' },
        },
        textShimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
