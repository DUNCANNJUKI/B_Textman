import type { UserConfig } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode, command }) => {
  const plugins = [react()];
  // Dynamically import Cloudflare plugin (ESM-only) to avoid require/interop issues
  try {
    const cf = await import('@cloudflare/vite-plugin');
    const cloudflare = (cf as any).cloudflare ?? (cf as any).default?.cloudflare;
    if (cloudflare) plugins.push(cloudflare());
  } catch (e) {
    console.warn('Cloudflare Vite plugin not available or failed to load:', e);
  }
  
  // Only load lovable-tagger in dev server, not during builds
  if (mode === 'development' && command === 'serve') {
    try {
      const mod = await import('lovable-tagger');
      const componentTagger = (mod as any).componentTagger ?? (mod as any).default?.componentTagger;
      if (componentTagger) plugins.push(componentTagger());
    } catch (e) {
      console.warn('lovable-tagger not available:', e);
    }
  }
  
  const config: UserConfig = {
    base: './', // Use relative paths for static hosting
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: undefined, // Single bundle for simplicity
        },
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
  
  return config;
});
