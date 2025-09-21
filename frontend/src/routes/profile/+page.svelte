<script>
    import { authStore } from '$lib/stores/auth.svelte.js';
    import { supabase } from '$lib/supabase.js';
    import { onMount } from 'svelte';

    let userProfile = $state(null);
    let loading = $state(true);
    let isEditing = $state(false);
    let editData = $state({
        first_name: '',
        last_name: '',
        bio: '',
        linkedin_url: '',
        headshot_image: ''
    });
    let saving = $state(false);

    async function fetchUserProfile() {
        if (!authStore.user?.id) {
            loading = false;
            return;
        }

        try {
            const { data, error } = await supabase
                .from('documents')
                .select('first_name, last_name, bio, linkedin_url, headshot_image')
                .eq('id', authStore.user.id)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
            } else {
                userProfile = data;
                editData = {
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    bio: data.bio || '',
                    linkedin_url: data.linkedin_url || '',
                    headshot_image: data.headshot_image || ''
                };
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        if (authStore.user) {
            fetchUserProfile();
        }
    });

    // Watch for auth changes using $effect
    $effect(() => {
        if (authStore.user) {
            fetchUserProfile();
        }
    });

    async function saveProfile() {
        if (!authStore.user?.id) return;

        saving = true;

        try {
            const { error } = await supabase
                .from('documents')
                .update({
                    first_name: editData.first_name,
                    last_name: editData.last_name,
                    bio: editData.bio,
                    linkedin_url: editData.linkedin_url,
                    headshot_image: editData.headshot_image
                })
                .eq('id', authStore.user.id);

            if (error) {
                console.error('Error updating profile:', error);
                alert('Failed to save profile. Please try again.');
            } else {
                userProfile = { ...editData };
                isEditing = false;
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            saving = false;
        }
    }

    function cancelEdit() {
        editData = {
            first_name: userProfile.first_name || '',
            last_name: userProfile.last_name || '',
            bio: userProfile.bio || '',
            linkedin_url: userProfile.linkedin_url || '',
            headshot_image: userProfile.headshot_image || ''
        };
        isEditing = false;
    }

</script>

<div class="profile-container">
    <div class="profile-header">
        <h1>Profile</h1>
    </div>

    {#if loading}
        <div class="loading-card">
            <div class="loading-spinner"></div>
            <p>Loading profile...</p>
        </div>
    {:else if authStore.user && userProfile}
        <div class="profile-card">
            <div class="profile-card-header">
                <button class="edit-btn" onclick={() => isEditing = !isEditing}>
                    {#if isEditing}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18"/>
                            <path d="M6 6l12 12"/>
                        </svg>
                        Cancel
                    {:else}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                    {/if}
                </button>
            </div>
            <div class="profile-avatar">
                <img
                    src={userProfile.headshot_image || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y.jpg'}
                    alt="Profile"
                />
            </div>

            {#if isEditing}
                <div class="edit-form">
                    <div class="form-group">
                        <label for="headshot">Profile Picture URL</label>
                        <input
                            id="headshot"
                            type="url"
                            bind:value={editData.headshot_image}
                            placeholder="https://example.com/photo.jpg"
                        />
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name</label>
                            <input
                                id="firstName"
                                type="text"
                                bind:value={editData.first_name}
                                placeholder="First Name"
                            />
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name</label>
                            <input
                                id="lastName"
                                type="text"
                                bind:value={editData.last_name}
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="bio">Bio</label>
                        <textarea
                            id="bio"
                            bind:value={editData.bio}
                            placeholder="Tell us about yourself..."
                            rows="4"
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label for="linkedin">LinkedIn URL</label>
                        <input
                            id="linkedin"
                            type="url"
                            bind:value={editData.linkedin_url}
                            placeholder="https://linkedin.com/in/yourprofile"
                        />
                    </div>

                    <div class="form-actions">
                        <button class="save-btn" onclick={saveProfile} disabled={saving}>
                            {#if saving}
                                <div class="button-spinner"></div>
                                Saving...
                            {:else}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                    <polyline points="17,21 17,13 7,13 7,21"/>
                                    <polyline points="7,3 7,8 15,8"/>
                                </svg>
                                Save Changes
                            {/if}
                        </button>
                        <button class="cancel-btn" onclick={cancelEdit}>
                            Cancel
                        </button>
                    </div>
                </div>
            {:else}
                <div class="profile-info">
                    <h2>{userProfile.first_name} {userProfile.last_name}</h2>
                    <p class="email">{authStore.user.email}</p>

                    {#if userProfile.bio}
                        <div class="bio-section">
                            <h3>Bio</h3>
                            <p class="bio">{userProfile.bio}</p>
                        </div>
                    {/if}

                    {#if userProfile.linkedin_url}
                        <div class="links-section">
                            <h3>Links</h3>
                            <a href={userProfile.linkedin_url} target="_blank" rel="noopener noreferrer" class="linkedin-link">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a .66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                                </svg>
                                LinkedIn Profile
                            </a>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    {:else if authStore.user}
        <div class="profile-card">
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                <h3>Profile not found</h3>
                <p>Please complete your setup to create your profile.</p>
                <a href="/setup" class="setup-link">Complete Profile Setup</a>
            </div>
        </div>
    {/if}

    <div class="profile-actions">
        <button class="logout-btn" onclick={() => authStore.signOut()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
        </button>
    </div>
</div>

<style>
    .profile-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'DM Mono', monospace;
    }

    .profile-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .profile-header h1 {
        margin: 0;
        color: var(--txt-0);
        font-size: 2rem;
        font-weight: 300;
    }

    /* Button styles */
    .logout-btn, .setup-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        font-weight: 500;
        text-decoration: none;
        justify-content: center;
    }

    /* Danger action - Red */
    .logout-btn {
        background: #dc2626;
        color: white;
    }

    .logout-btn:hover {
        background: #b91c1c;
    }

    /* Setup link - Blue outline */
    .setup-link {
        background: transparent;
        color: #2563eb;
        border: 2px solid #2563eb;
    }

    .setup-link:hover {
        background: #2563eb;
        color: white;
    }

    .logout-btn svg {
        width: 16px;
        height: 16px;
    }

    .loading-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem;
        background: var(--bg-2);
        border: 1px solid var(--bg-3);
        border-radius: 0.5rem;
        color: var(--txt-1);
    }

    .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--bg-3);
        border-top: 3px solid var(--acc-1);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .profile-card {
        background: var(--bg-2);
        border: 1px solid var(--bg-3);
        border-radius: 0.5rem;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .profile-avatar {
        display: flex;
        justify-content: center;
        margin-bottom: 2rem;
    }

    .profile-avatar img {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--bg-3);
    }

    .profile-info h2 {
        text-align: center;
        margin: 0 0 0.5rem 0;
        color: var(--txt-0);
        font-size: 1.5rem;
        font-weight: 300;
    }

    .email {
        text-align: center;
        color: var(--txt-2);
        margin-bottom: 2rem;
        font-size: 0.875rem;
    }

    .bio-section, .links-section {
        margin-top: 2rem;
    }

    .bio-section h3, .links-section h3 {
        margin: 0 0 0.75rem 0;
        color: var(--txt-0);
        font-size: 1rem;
        font-weight: 400;
    }

    .bio {
        color: var(--txt-1);
        line-height: 1.6;
        margin: 0;
    }

    .linkedin-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--acc-1);
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.2s ease;
    }

    .linkedin-link:hover {
        color: var(--acc-2);
    }

    .linkedin-link svg {
        width: 20px;
        height: 20px;
    }



    .empty-state {
        text-align: center;
        padding: 3rem 2rem;
        color: var(--txt-2);
    }

    .empty-state svg {
        width: 64px;
        height: 64px;
        margin-bottom: 1rem;
        color: var(--txt-3);
    }

    .empty-state h3 {
        margin: 0 0 0.5rem 0;
        color: var(--txt-1);
        font-size: 1.25rem;
    }

    .empty-state p {
        margin: 0 0 1.5rem 0;
        color: var(--txt-2);
    }


    .profile-card-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1rem;
    }

    .edit-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border: 1px solid var(--bg-3);
        background: var(--bg-1);
        color: var(--txt-1);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        font-weight: 400;
    }

    .edit-btn:hover {
        background: var(--bg-3);
        color: var(--txt-0);
    }

    .edit-btn svg {
        width: 16px;
        height: 16px;
    }

    .edit-form {
        padding: 1rem 0;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--txt-0);
        font-size: 0.875rem;
        font-weight: 500;
    }

    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--bg-3);
        border-radius: 0.375rem;
        background: var(--bg-1);
        color: var(--txt-0);
        font-family: inherit;
        font-size: 0.875rem;
        transition: border-color 0.2s ease;
    }

    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--acc-1);
    }

    .form-group textarea {
        resize: vertical;
        min-height: 100px;
    }

    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--bg-3);
    }

    .save-btn, .cancel-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        font-weight: 500;
        border: 2px solid transparent;
    }

    .save-btn {
        background: #059669;
        color: white;
        border-color: #059669;
    }

    .save-btn:hover:not(:disabled) {
        background: #047857;
        border-color: #047857;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3);
    }

    .save-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .cancel-btn {
        background: white;
        color: #6b7280;
        border-color: #d1d5db;
    }

    .cancel-btn:hover {
        background: #f9fafb;
        border-color: #9ca3af;
        color: #374151;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .save-btn svg {
        width: 16px;
        height: 16px;
    }

    .button-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .profile-actions {
        margin-top: 3rem;
        display: flex;
        justify-content: center;
    }


    @media (max-width: 768px) {
        .profile-container {
            padding: 1rem;
        }

        .profile-header {
            flex-direction: column;
            gap: 1rem;
            align-items: center;
        }

        .profile-avatar img {
            width: 100px;
            height: 100px;
        }

        .form-row {
            grid-template-columns: 1fr;
        }

        .form-actions {
            flex-direction: column;
        }

        .save-btn, .cancel-btn {
            justify-content: center;
        }
    }
</style>