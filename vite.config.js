import { defineConfig } from 'vite'
import autoindex from './plugin.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [autoindex()],
})
