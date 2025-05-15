"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  profile_complete?: boolean
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      // Get user from localStorage
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        // Only update state if the user has changed
        if (!user || user.id !== parsedUser.id) {
          setUser(parsedUser)
        }
      } else if (user !== null) {
        setUser(null)
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
      if (user !== null) {
        setUser(null)
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true)
      await refreshUser()
      setLoading(false)
    }

    initializeAuth()
  }, [])
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true)
      await refreshUser()
      setLoading(false)
    }

    initializeAuth()
  }, []) // Add empty dependency array here

  return <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>{children}</AuthContext.Provider>
}
