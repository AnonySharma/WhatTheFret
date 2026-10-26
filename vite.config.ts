import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  // Served from https://anonysharma.github.io/WhatTheFret/
  base: '/WhatTheFret/',
  plugins: [react(), tailwindcss()],
});
