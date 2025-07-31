import tailwindcss from "@tailwindcss/vite";
import { defineNuxtConfig } from 'nuxt/config';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  modules: [
    '@pinia/nuxt',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui'
  ],
  runtimeConfig: {
    public: {
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'
    }
  },
  routeRules: {
    '/api/**': {
      proxy: 'http://localhost:5000/api/**'
    }
  }
});