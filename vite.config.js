import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import removeConsole from 'vite-plugin-remove-console'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react(),
      // Remove console logs in production
      isProduction && removeConsole(),
      VitePWA({
        manifest: {
          name: 'Musica Universalis',
          short_name: 'Musica Universalis',
          description: 'A sound synthesis application based on the movement of celestial bodies',
          theme_color: '#ffffff',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
          ]
        },
        registerType: 'autoUpdate'
      })
    ],
    build: {
      // Enable minification settings for production
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      // CSS minification is enabled by default
      cssMinify: true,
      // HTML minification settings
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom']
          }
        }
      }
    }
  }
})