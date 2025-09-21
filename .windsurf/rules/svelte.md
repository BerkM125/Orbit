---
trigger: manual
---

---
description: Always refer to the Svelte 5/SvelteKit documentation when making edits in the frontend folder
globs: ["frontend/**/*"]
alwaysApply: true
---

**IMPORTANT: This project uses Svelte 5 with runes syntax. Always use runes ($state, $derived, $effect, etc.) instead of the legacy reactive statements (like `let count = 0` with `$:` statements) and stores.**

When making any edits to files in the /frontend folder, always refer to the /frontend/docs/svelte-documentation-medium.txt file for:

- Svelte 5 syntax and best practices
- SvelteKit conventions and patterns
- Component structure and lifecycle
- State management approaches
- Routing and navigation
- Build and deployment considerations

This documentation contains the most up-to-date information for Svelte 5 and SvelteKit development. Always consult it before implementing features or making changes.
