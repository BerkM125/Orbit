<script>
    import { authStore } from '$lib/stores/auth.svelte.js';
    
    // Simple reactive variables for name display
    $: firstName = authStore.user?.user_metadata?.full_name?.split(' ')[0] || authStore.user?.email?.split('@')[0] || 'User';
    $: lastName = authStore.user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';
</script>

<div class="profile-container">
    <h1>Profile</h1>

    {#if authStore.user}
        <div class="user-info">
            <h2>Welcome, {firstName} {lastName}</h2>
            <p>Email: {authStore.user.email}</p>
            <p>First Name: {firstName}</p>
            <p>Last Name: {lastName}</p>
        </div>
    {/if}

    <button class="logout-btn" onclick={() => authStore.signOut()}>
        Logout
    </button>
</div>

<style>
    .profile-container {
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
    }

    .user-info {
        margin: 2rem 0;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 0.5rem;
    }

    .logout-btn {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-top: 2rem;
    }

    .logout-btn:hover {
        background: #dc2626;
    }

    h1 {
        margin-bottom: 1rem;
    }

    h2 {
        margin-bottom: 0.5rem;
        color: #374151;
    }

    p {
        color: #6b7280;
    }
</style>