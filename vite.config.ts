import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'packages/mechanics/src/**/*.test.{ts,tsx}',
      'server/**/*.test.ts',
      'shared/**/*.test.ts',
    ],
  },
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
      "@/features/combat": path.resolve(__dirname, "src/features/combat"),
      "@/features/encounter": path.resolve(__dirname, "src/features/encounter"),
      "@/features/game-session": path.resolve(__dirname, "src/features/game-session"),
      "@/features/character": path.resolve(__dirname, "src/features/character"),
      "@/features/levelUp": path.resolve(__dirname, "src/features/levelUp"),
      "@/features/campaign": path.resolve(__dirname, "src/features/campaign"),
      "@/features/message": path.resolve(__dirname, "src/features/message"),
      "@/features/npc": path.resolve(__dirname, "src/features/npc"),
      "@/features/skillProficiency": path.resolve(__dirname, "src/features/skillProficiency"),
      "@/features/mechanics/domain": path.resolve(__dirname, "packages/mechanics/src"),
      "@/features/content": path.resolve(__dirname, "src/features/content"),
      "@/features/notification": path.resolve(__dirname, "src/features/notification"),
      "@/features/session": path.resolve(__dirname, "src/features/session"),
      "@/features/user": path.resolve(__dirname, "src/features/user"),
      "@/features/utils": path.resolve(__dirname, "src/features/utils"),
      "@/hooks": path.resolve(__dirname, "src/hooks"),
      "@/services": path.resolve(__dirname, "src/services"),
      "@/shared/domain": path.resolve(__dirname, "shared/domain"),
      "@/shared/money": path.resolve(__dirname, "shared/money"),
      "@/shared/weight": path.resolve(__dirname, "shared/weight"),
      "@/shared/lib/media": path.resolve(__dirname, "shared/lib/media"),
      "@/shared": path.resolve(__dirname, "shared/types"),
      "@/shared/permissions": path.resolve(__dirname, "shared/permissions"),
      "@/steps": path.resolve(__dirname, "src/steps"),
      "@/ui/hooks": path.resolve(__dirname, "src/ui/hooks"),
      "@/ui/patterns": path.resolve(__dirname, "src/ui/patterns"),
      "@/ui/primitives": path.resolve(__dirname, "src/ui/primitives"),
      "@/ui/types": path.resolve(__dirname, "src/ui/types"),
      "@/utils": path.resolve(__dirname, "src/utils"),
      "@repo-assets": path.resolve(__dirname, "assets"),
    }
  }
})
