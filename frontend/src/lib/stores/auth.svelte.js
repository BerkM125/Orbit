import { supabase } from '$lib/supabase.js';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

class AuthStore {
	user = $state(null);
	session = $state(null);
	loading = $state(true);

	constructor() {
		if (browser) {
			this.init();
		}
	}

	async init() {
		try {
			// Get initial session
			const {
				data: { session },
				error
			} = await supabase.auth.getSession();
			if (error) {
				console.error('Error getting session:', error);
				return;
			}

			this.session = session;
			this.user = session?.user ?? null;
			this.loading = false;

			// Listen for auth changes
			supabase.auth.onAuthStateChange((event, session) => {
				this.session = session;
				this.user = session?.user ?? null;
				this.loading = false;

				if (event === 'SIGNED_IN') {
					// Don't redirect immediately - let the layout handle the flow
					// The socket connection will determine if user needs setup or can go to home
				} else if (event === 'SIGNED_OUT') {
					goto('/login');
				}
			});
		} catch (error) {
			console.error('Error initializing auth:', error);
			this.loading = false;
		}
	}

	async signInWithGitHub() {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'github',
				options: {
					redirectTo: `${window.location.origin}/`
				}
			});
			if (error) {
				console.error('Error signing in with GitHub:', error);
				throw error;
			}
		} catch (error) {
			console.error('GitHub sign-in error:', error);
			throw error;
		}
	}

	async signOut() {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) {
				console.error('Error signing out:', error);
				throw error;
			}
		} catch (error) {
			console.error('Sign out error:', error);
			throw error;
		}
	}

	get isAuthenticated() {
		return !!this.user && !!this.session;
	}
}

export const authStore = new AuthStore();
