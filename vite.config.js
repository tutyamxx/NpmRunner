import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        historyApiFallback: true
    },
    build: {
        outDir: 'dist'
    },
    base: '/',
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.js',
        include: ['**/*.{test,spec}.{js,ts,jsx,tsx}']
    }
});
