import { defineConfig } from 'vitest/config'
import {fileURLToPath} from "node:url";

const nodeVersion = Number(process.versions.node.split('.')[0])

const execArgv = []

if (nodeVersion >= 25) {
    // In Node v25 `localstorage` appears as Proxy object and calling method `localstorage.get`
    // causes the following error:
    // `Uncaught TypeError: localStorage.get is not a function`
    //
    // Workaround is disabling `localstorage` with option `NODE_OPTIONS=--no-webstorage`
    //
    // Link: https://zenn.dev/mima_ita/articles/775119d66803bf?locale=en
    execArgv.push('--no-webstorage')
}


export default defineConfig({
    test: {
        testTimeout: 0,
        setupFiles: [
          // For .toBeInTheDocument() assertions to work
          '@testing-library/jest-dom/vitest',
        ],
        env: {
            VITE_SERVER_URL: 'http://localhost:3000',
        },
        environment: 'jsdom',
        execArgv: execArgv,
        include: [
          '**/*.test.ts',
          '**/*.test.tsx'
        ],
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
})
