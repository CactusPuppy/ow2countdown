import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
        plugins: [sveltekit()],
        ssr: {
                noExternal: ['@fortawesome/free-solid-svg-icons', '@fortawesome/free-brands-svg-icons'],
        },
        define: {
                'import.meta.env.VERCEL_ANALYTICS_ID': JSON.stringify(process.env.VERCEL_ANALYTICS_ID)
        }
};

export default config;
