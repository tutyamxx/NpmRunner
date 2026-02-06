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
        provider: 'istanbul',
        environment: 'jsdom',
        setupFiles: './src/setupTests.js',
        include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
        exclude: ['node_modules/', 'test/'],
        reporters: ['tree'],
        silent: false
    }
});
