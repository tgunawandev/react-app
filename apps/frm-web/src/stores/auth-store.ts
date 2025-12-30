import { create } from 'zustand'

interface FrappeUser {
  name: string
  email: string
  full_name: string
  roles: string[]
}

interface AuthState {
  user: FrappeUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: FrappeUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}))
