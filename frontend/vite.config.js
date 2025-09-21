import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		Icons({
			compiler: 'svelte',
			defaultClass: 'icon'
		})
	],
	server: {
		host: true,
		allowedHosts: [
			'e00130745119.ngrok-free.app',
			'localhost',
			'127.0.0.1'
		]
	}
});
