<script>
  import { authStore } from '$lib/stores/auth.svelte.js'
  import { onMount } from 'svelte'

  let loading = $state(false)
  let error = $state('')

  onMount(() => {
    // If already authenticated, redirect to profile
    if (authStore.isAuthenticated) {
      window.location.href = '/profile'
    }
  })

  async function handleGitHubLogin() {
    loading = true
    error = ''

    try {
      await authStore.signInWithGitHub()
    } catch (err) {
      error = err.message || 'Failed to sign in with GitHub'
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Login - [project name]</title>
</svelte:head>

<div class="login-container">
  <div class="login-card">
    <h1>Welcome to [project name]</h1>
    <p>Connect with professionals in your area through our location-based networking platform.</p>

    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}

    <button
      class="github-login-btn"
      onclick={handleGitHubLogin}
      disabled={loading}
    >
      {#if loading}
        <span class="loading-spinner"></span>
        Signing in...
      {:else}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Continue with GitHub
      {/if}
    </button>

    <div class="info-text">
      <p>By continuing, you agree to our terms of service and privacy policy.</p>
    </div>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .login-card {
    background: white;
    padding: 3rem;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 400px;
    width: 100%;
    text-align: center;
  }

  h1 {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: #1f2937;
  }

  p {
    color: #6b7280;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .github-login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem;
    background: #24292e;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-bottom: 2rem;
  }

  .github-login-btn:hover:not(:disabled) {
    background: #1a1e22;
  }

  .github-login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #ffffff33;
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    background: #fef2f2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .info-text {
    font-size: 0.8rem;
    color: #9ca3af;
  }

  .info-text p {
    margin: 0;
  }
</style>