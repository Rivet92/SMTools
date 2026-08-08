/// <reference types="vitest/config" />
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function minifyTranslations(): Plugin {
  return {
    name: 'minify-translations',
    closeBundle() {
      const dir = resolve(__dirname, 'dist', 'translations');
      if (!existsSync(dir)) return;
      for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
        const fp = join(dir, file);
        writeFileSync(fp, JSON.stringify(JSON.parse(readFileSync(fp, 'utf-8'))), 'utf-8');
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, '..'), '');

  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5125';
  const devPort = parseInt(env.FRONTEND_DEV_PORT || '8080', 10);

  const backendProxy = {
    target: backendUrl,
    changeOrigin: true,
    secure: false,
    xfwd: true,
  };

  return {
    plugins: [react(), minifyTranslations()],
    envDir: '..',
    base: env.BASE_URL || '/',
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test-setup.ts',
      exclude: ['e2e/**', 'node_modules/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'html', 'lcovonly'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          '**/__tests__',
          '**/*.test.*',
          'src/types/generated/**',
          'src/**/index.ts',
          'src/**/*.d.ts',
        ],
      },
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      port: devPort,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        '/api': backendProxy,
        '/avatars': backendProxy,
        '/scalar': backendProxy,
        '/openapi': backendProxy,
        '/hubs': {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
          secure: false,
          xfwd: true,
        },
      },
    },
    preview: {
      port: devPort,
      strictPort: true,
    },
    build: {
      sourcemap: mode !== 'production',
      target: 'es2023',
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'INVALID_ANNOTATION') return;
          warn(warning);
        },
        output: {
          manualChunks(id) {
            // Core features loaded in the entry chunk: we do not split them.
            const coreFeatures = new Set([
              'auth',
              'error',
              'i18n',
              'landing',
              'layout',
              'menu',
              'seo',
              'theme',
            ]);

            // Shared components: group into a single chunk to avoid duplication.
            if (id.includes('/src/components/')) return 'components-shared';

            const featureMatch = id.match(/\/src\/features\/([^/]+)\//);
            if (featureMatch && !coreFeatures.has(featureMatch[1])) {
              return featureMatch[1];
            }

            if (!id.includes('node_modules')) return;

            // Large, stable vendors: splitting them improves caching.
            if (id.includes('react-dom') || id.includes('scheduler')) return 'react-dom';
            if (id.includes('@mui/') || id.includes('@emotion/')) return 'mui';

            // Remaining dependencies in a single vendor chunk.
            return 'vendor';
          },
        },
      },
    },
  };
});
