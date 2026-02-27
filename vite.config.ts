import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, './src/app'),
      '@/features/characterBuilder': path.resolve(__dirname, './src/features/characterBuilder'),
      '@/features/characterBuilder/context': path.resolve(__dirname, './src/features/characterBuilder/context'),
      "@/ui/elements": path.resolve(__dirname, "src/ui/elements"),
      "@/ui/components": path.resolve(__dirname, "src/ui/components"),
      "@/ui/fields": path.resolve(__dirname, "src/ui/components/fields"),
      "@/ui/form": path.resolve(__dirname, "src/ui/components/form"),
      "@/data": path.resolve(__dirname, "src/data"),
      "@/domain/shared": path.resolve(__dirname, "src/domain/shared"),
      "@/domain": path.resolve(__dirname, "src/domain"),
      "@/chat": path.resolve(__dirname, "src/features/chat"),
      "@/features/auth": path.resolve(__dirname, "src/features/auth"),
      "@/features/account": path.resolve(__dirname, "src/features/account"),
      "@/features/character": path.resolve(__dirname, "src/features/character"),
      "@/features/levelUp": path.resolve(__dirname, "src/features/levelUp"),
      "@/features/campaign": path.resolve(__dirname, "src/features/campaign"),
      "@/features/messaging": path.resolve(__dirname, "src/features/messaging"),
      "@/features/monster": path.resolve(__dirname, "src/features/monster"),
      "@/features/npc": path.resolve(__dirname, "src/features/npc"),
      "@/features/spell": path.resolve(__dirname, "src/features/spell"),
      "@/features/equipment": path.resolve(__dirname, "src/features/equipment"),
      "@/features/location": path.resolve(__dirname, "src/features/location"),
      "@/features/mechanics": path.resolve(__dirname, "src/features/mechanics"),
      "@/features/content": path.resolve(__dirname, "src/features/content"),
      "@/features/notification": path.resolve(__dirname, "src/features/notification"),
      "@/features/session": path.resolve(__dirname, "src/features/session"),
      "@/features/user": path.resolve(__dirname, "src/features/user"),
      "@/hooks": path.resolve(__dirname, "src/hooks"),
      "@/services": path.resolve(__dirname, "src/services"),
      "@/shared/domain": path.resolve(__dirname, "shared/domain"),
      "@/shared": path.resolve(__dirname, "shared/types"),
      "@/shared/permissions": path.resolve(__dirname, "shared/permissions"),
      "@/steps": path.resolve(__dirname, "src/steps"),
      "@/ui/badges": path.resolve(__dirname, "src/ui/badges"),
      "@/ui/avatar": path.resolve(__dirname, "src/ui/avatar"),
      "@/ui/cards": path.resolve(__dirname, "src/ui/cards"),
      "@/ui/modals": path.resolve(__dirname, "src/ui/modals"),
      "@/ui/stats": path.resolve(__dirname, "src/ui/stats"),
      "@/utils": path.resolve(__dirname, "src/utils"),
    }
  }
})
