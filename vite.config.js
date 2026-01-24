import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        historyApiFallback: true
    },
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 2000
    },
    base: '/',
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.js',
        include: ['**/*.{test,spec}.{js,ts,jsx,tsx}']
    }
});
