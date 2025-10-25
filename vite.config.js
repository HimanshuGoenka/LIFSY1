import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


const repoName = 'your-repo-namLIFSY' 

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production' || process.env.NODE_ENV === 'production'

  return {
    base: isProd ? `/${LIFSY}/` : '/', 
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
