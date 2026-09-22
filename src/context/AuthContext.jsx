/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)
const USERS_KEY = 'genz_users'
const SESSION_KEY = 'genz_session'

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || []
  } catch {
    return []
  }
}

function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

async function hashPassword(password) {
  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(`genz-wear::${password}`)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  let hash = 0
  const s = `genz-wear::${password}`
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i)
    hash |= 0
  }
  return `hash-${Math.abs(hash).toString(16)}`
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredSession())
  const [users, setUsers] = useState(() => getStoredUsers())

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }, [users])

  const register = useCallback(
    async ({ name, email, password }) => {
      const cleanEmail = email.trim().toLowerCase()
      const cleanName = name.trim()

      if (!cleanName) throw new Error('Name is required')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Enter a valid email')
      if (password.length < 6) throw new Error('Password must be at least 6 characters')
      if (getStoredUsers().some((u) => u.email === cleanEmail)) {
        throw new Error('An account with this email already exists')
      }

      const passwordHash = await hashPassword(password)
      const newUser = {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        createdAt: new Date().toISOString(),
      }

      setUsers((prev) => [...prev, newUser])
      const session = { name: cleanName, email: cleanEmail }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
      return session
    },
    []
  )

  const login = useCallback(async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase()
    const passwordHash = await hashPassword(password)
    const found = getStoredUsers().find(
      (u) => u.email === cleanEmail && u.passwordHash === passwordHash
    )
    if (!found) throw new Error('Incorrect email or password')

    const session = { name: found.name, email: found.email }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}