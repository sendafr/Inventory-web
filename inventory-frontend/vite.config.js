import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Remove the 'server' block entirely for production builds
  // The proxy only works in 'npm run dev'
})