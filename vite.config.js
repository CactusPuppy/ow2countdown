import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
        plugins: [sveltekit()],
        ssr: {
                noExternal: ['@fortawesome/free-solid-svg-icons', '@fortawesome/free-brands-svg-icons'],
        }
};

export default config;
