import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    plugins: [vue()],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    build: {
      // === Головне: dev = без мініфікації, build = з мініфікацією ===
      minify: isDev ? false : 'esbuild',
      target: 'es2015',
      cssMinify: !isDev,
      sourcemap: isDev,                    // source maps тільки для dev

      chunkSizeWarningLimit: 1500,
      cssCodeSplit: false,

      rollupOptions: {
        output: {
          entryFileNames: 'js/prime-datatable.js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'css/prime-datatable.css'
            }
            return 'css/[name].[ext]'
          }
        }
      }
    },

    esbuild: {
      drop: isDev ? [] : ['console', 'debugger'],
    }
  }
})
