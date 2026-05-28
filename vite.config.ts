import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import {VitePWA} from "vite-plugin-pwa";

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
    }),
  ],
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
})
