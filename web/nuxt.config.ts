// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: false },
    modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', 'nuxt-icon', '@nuxtjs/color-mode'],
    shadcn: {
        componentDir: './components/ui',
    },
    css: ['~/assets/css/main.scss'],
    colorMode: {
        classSuffix: '',
    },
});