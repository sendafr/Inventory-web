import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import client, { setAuthToken, authAPI } from '../api/client'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [tokens, setTokens] = useState(() => {
    const stored = localStorage.getItem('authTokens')
    return stored? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tokens) {
      setAuthToken(tokens.access)
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const { data } = await authAPI.me()
      setUser(data)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    const { data } = await authAPI.login({ username, password })
    localStorage.setItem('authTokens', JSON.stringify(data))
    setTokens(data)
    setAuthToken(data.access)
    await fetchUser()
  }
  
  
  const register = async (userData) => {

    await authAPI.register(userData)
    await login(userData.username, userData.password)
  } 

  const logout = () => {
    localStorage.removeItem('authTokens')
    setTokens(null)
    setUser(null)
    setAuthToken(null)
  }

  // Auto refresh logic stays same, but use authAPI.refresh()

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  )
}