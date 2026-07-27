import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const isReact = mode === 'react'

  // ==================== ЗБІРКА ДЛЯ REACT ====================
  if (isReact) {
    return {
      plugins: [vue()],

      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        }
      },

      build: {
        lib: {
          entry: resolve(__dirname, 'src/entry-react.ts'),
          name: 'YiiDataTable',
          formats: ['es', 'umd'],
          fileName: (format) => `js/prime-datatable-react.${format}.js`
        },

        minify: true,
        target: 'es2015',
        cssMinify: true,
        sourcemap: false,
        cssCodeSplit: false,
        outDir: 'dist',
        emptyOutDir: false, // щоб не затирати vue-збірку

        rollupOptions: {
          // все пакуємо всередину бандла
          external: [],
          output: {
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'css/prime-datatable-react.css'
              }
              return 'css/[name].[ext]'
            },
            // для UMD
            globals: {}
          }
        },

        chunkSizeWarningLimit: 1500,
      },

      esbuild: {
        drop: ['console', 'debugger'],
      }
    }
  }

  // ==================== ЗБІРКА ДЛЯ VUE (як було) ====================
  return {
    plugins: [vue()],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    build: {
      minify: isDev ? false : 'esbuild',
      target: 'es2015',
      cssMinify: !isDev,
      sourcemap: isDev,
      chunkSizeWarningLimit: 1500,
      cssCodeSplit: false,
      outDir: 'dist',
      emptyOutDir: true, // vue-збірка чистить dist

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
