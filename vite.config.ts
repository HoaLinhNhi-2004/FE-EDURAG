import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Khi không bật mock (bản production), gỡ file service worker của MSW khỏi dist.
 * Bổ trợ cho gate ở main.tsx (task B1): runtime đã không nạp mock, plugin này bảo đảm
 * artifact build cũng không kèm file worker mock để tránh vô tình đăng ký ở prod.
 */
function stripMockWorker(enableMock: boolean): Plugin {
  return {
    name: 'strip-mock-worker',
    apply: 'build',
    closeBundle() {
      if (enableMock) return
      const workerFile = path.resolve(__dirname, 'dist/mockServiceWorker.js')
      if (fs.existsSync(workerFile)) fs.rmSync(workerFile)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const enableMock = env.VITE_ENABLE_MOCK === 'true'

  return {
    plugins: [react(), tailwindcss(), stripMockWorker(enableMock)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  }
})
