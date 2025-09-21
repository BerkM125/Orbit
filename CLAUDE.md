# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cascadia 2025 is a professional networking application with real-time location-based features. The project consists of:

- **Frontend**: Svelte 5 with SvelteKit application using modern runes syntax
- **Backend**: Node.js/Express server with Socket.IO for real-time communication and Supabase integration

## Development Commands

### Frontend (SvelteKit + Svelte 5)
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run format       # Format code with Prettier
npm run lint         # Run ESLint and Prettier checks
```

### Backend (Node.js + Express + Socket.IO)
```bash
cd backend
npm run vectorize    # Run profile vectorization script
```

## Architecture & Key Components

### Frontend Structure
- **Svelte 5 with Runes**: Uses modern `$state`, `$derived`, `$effect` syntax instead of legacy reactive statements
- **SvelteKit Routes**: File-based routing in `src/routes/`
  - `/` - Home page
  - `/map` - Interactive map with Mapbox GL
  - `/profile` - User profile management
  - `/signup` - User registration
- **Layout**: Fixed bottom navigation with container structure
- **Documentation**: Comprehensive Svelte 5 docs available at `frontend/docs/svelte-documentation-medium.txt`

### Backend Structure
- **Express Server**: Main server in `src/index.js` with CORS enabled
- **Socket.IO Integration**: Real-time communication for location updates and room management
- **Modular Services**:
  - `local_modules/roomData.js` - Room and user management
  - `local_modules/locationServices.js` - Location processing and room assignment
  - `local_modules/supabaseIntegration.js` - Database integration
- **Database**: Supabase integration with user profiles and room management
- **Real-time Features**: 10-second interval updates for location data

### Key Integrations
- **Mapbox GL**: Frontend mapping functionality
- **Supabase**: Backend database and authentication
- **OpenAI**: Profile vectorization for matching algorithms
- **Socket.IO**: Real-time location sharing and room updates

## Important Development Notes

### Svelte 5 Requirements
- **Always use Svelte 5 runes syntax** (`$state`, `$derived`, `$effect`) instead of legacy reactive statements
- Refer to `frontend/docs/svelte-documentation-medium.txt` for current Svelte 5 patterns and best practices
- Component props use `let { children } = $props()` syntax

### Real-time Architecture
- Backend sends location requests every 10 seconds via `get-location` event
- User location data processed through `processUserLocation()` function
- Room-based user management with automatic cleanup on disconnect

### Environment Configuration
- Backend uses `PORT` environment variable (default 3000) for Cloud Run compatibility
- Environment example available at `backend/env.example`
- Database schemas defined in `backend/db/` directory

## Testing
No specific test frameworks are currently configured. Check with the team for testing approach before implementing test suites.