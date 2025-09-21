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
			'99f4f29b3cc8.ngrok-free.app',
			'localhost',
			'127.0.0.1'
		]
	}
});
