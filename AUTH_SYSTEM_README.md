# Global Authentication State System

This document explains the global authentication state system implemented in the React application using Supabase.

## Overview

The authentication system provides a centralized way to manage user authentication state across the entire React application. It uses React Context to store authentication state globally, preventing unnecessary re-renders and ensuring consistent state management.

## Architecture

### Components

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - React Context that holds the global authentication state
   - Provides authentication methods (signUp, signIn, signOut)
   - Manages session persistence and auth state changes

2. **AuthProvider** (`src/contexts/AuthContext.tsx`)
   - Context provider component that wraps the entire application
   - Initializes authentication state on app load
   - Listens for authentication changes from Supabase

3. **useAuth Hook** (`src/hooks/use-auth.ts`)
   - Custom hook that provides access to authentication state and methods
   - Must be used within an AuthProvider (throws error if not)

4. **ProtectedRoute** (`src/components/ProtectedRoute.tsx`)
   - Component that protects routes requiring authentication
   - Redirects unauthenticated users to login page
   - Shows loading state during authentication checks

## Usage

### Basic Usage

```tsx
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => signIn(email, password)}>Sign In</button>
      )}
    </div>
  )
}
```

### Protecting Routes

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Authentication Methods

```tsx
const { signUp, signIn, signOut } = useAuth()

// Sign up a new user
const { data, error } = await signUp('user@example.com', 'password')

// Sign in existing user
const { data, error } = await signIn('user@example.com', 'password')

// Sign out current user
const { error } = await signOut()
```

## State Properties

The `useAuth` hook returns the following properties:

- `user: User | null` - Current authenticated user object
- `session: Session | null` - Current session object
- `loading: boolean` - Whether authentication state is being loaded
- `signUp: (email: string, password: string) => Promise<{data, error}>` - Sign up function
- `signIn: (email: string, password: string) => Promise<{data, error}>` - Sign in function
- `signOut: () => Promise<{error}>` - Sign out function

## Features

### ✅ Single Source of Truth
- One global authentication state shared across all components
- No duplicate auth listeners or state management

### ✅ Automatic Session Management
- Detects user authentication on app load
- Persists authentication state across browser sessions
- Automatically updates state on login/logout

### ✅ Real-time Auth Changes
- Listens for authentication state changes from Supabase
- Updates all components instantly when auth state changes

### ✅ Protected Routes
- Easy-to-use ProtectedRoute component
- Automatic redirects for unauthenticated users
- Preserves intended destination after login

### ✅ TypeScript Support
- Full TypeScript integration
- Proper type definitions for all auth-related objects

### ✅ Error Handling
- Comprehensive error handling for all auth operations
- User-friendly error messages

## Setup

The AuthProvider must wrap your entire application in `src/App.tsx`:

```tsx
import { AuthProvider } from '@/contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  )
}
```

## Demo

Visit `/auth-status-demo` in the application to see a live demonstration of the authentication system, including:

- Current authentication status
- User information display
- Session details
- Usage examples and code snippets

## Benefits

1. **Performance**: Single auth listener prevents unnecessary re-renders
2. **Consistency**: Centralized state ensures all components show the same auth status
3. **Maintainability**: Clean separation of authentication logic
4. **Developer Experience**: Simple hook-based API for accessing auth state
5. **Security**: Proper session management and protected routes

## Migration from Local State

If you were previously using local authentication state in individual components, simply replace your local `useState` and `useEffect` calls with the `useAuth` hook. The API remains the same, but now uses global state.</content>
<parameter name="filePath">d:\Projects\Minor Project 2\ResearchSphere\AUTH_SYSTEM_README.md