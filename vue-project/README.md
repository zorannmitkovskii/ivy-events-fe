# Ivy Events - Frontend

Vue 3 + Vite frontend for the Ivy Events platform.

## Requirements

- Node.js 18+
- npm

## Quick Start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Environment Variables

Configure in `.env` or via `window.__ENV__` at runtime:

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL (default: `http://localhost:8081`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key (for location autocomplete) |
| `APP_ENV` | Environment: `local`, `test`, `prod` |

## Architecture

- **Framework**: Vue 3 Composition API
- **Router**: Vue Router with lang prefix (`/:lang/...`)
- **State**: Reactive stores (`reactive()`) - no Pinia/Vuex
- **Styling**: Bootstrap 5 + scoped CSS
- **API**: Axios with auto token refresh
- **i18n**: vue-i18n

### Key Directories

| Directory | Description |
|-----------|-------------|
| `src/pages/adminDashboard/` | Admin panel pages |
| `src/pages/auth/` | Login, signup, verify, reset password |
| `src/pages/dashboard/` | User dashboard |
| `src/pages/onboarding/` | Event creation flow |
| `src/composables/` | Reusable logic (edit mode, draft sync) |
| `src/services/` | API clients |
| `src/store/` | Reactive stores |

### Auth Service (`auth.service.js`)

Key exports:
- `loginWithCredentials(email, password)` - login + handle mustChangePassword redirect
- `getEventId()` / `getEventIds()` - read from JWT
- `getPackages()` - read from JWT
- `hasRole(role)` - check role from JWT
- `changePassword(email, currentPassword, newPassword)` - change password flow

## Testing

```bash
npm run test
```

## Documentation

See `/docs` folder for detailed documentation:
- [Architecture Overview](../../docs/architecture.md)
- [Admin Panel](../../docs/admin-panel.md)
- [Authentication](../../docs/authentication.md)
- [Events & Invitations](../../docs/events-and-invitations.md)
- [API Reference](../../docs/api-reference.md)
