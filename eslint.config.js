import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactX from "typescript-eslint"
import reactDom from "eslint-plugin-react-dom"

export default defineConfig([
  globalIgnores(['dist', 'playwright']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      reactX.configs.recommended,
      reactDom.configs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
