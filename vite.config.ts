import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

let LUCY_MODE = "safe";

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      // 🧠 LUCY EXECUTION HOOK
      {
        name: 'lucy-runtime-kernel',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('x-lucy-mode', LUCY_MODE);
            next();
          });
        },
        // 🧠 Hook into file updates (AI writes)
        handleHotUpdate({ file }) {
          console.log(`[LUCY KERNEL] File changed: ${file}`);
        }
      },
      // 🧠 LUCY AI BUILD-TIME HOOK
      {
        name: 'lucy-ai-hook',
        transform(code, id) {
          // intercept files before build
          // Lucy can rewrite code, auto-fix, or inject diagnostics here
          // if (id.endsWith('.tsx') || id.endsWith('.ts')) {
          //   console.log(`[LUCY AI HOOK] Transforming ${id}`);
          // }
          return null; 
        }
      }
    ],
    define: {
      'process.env.SANDBOX_MODE': JSON.stringify(true),
      __LUCY_MODE__: JSON.stringify(LUCY_MODE),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
