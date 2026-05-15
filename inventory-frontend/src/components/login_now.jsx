import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import '../styles/Auth.css'
import '../index.css'





export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({...form, username: e.target.value})}
            className="auth-input"
            required
          />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({...form, password: e.target.value})}
            className="auth-input"
            required
          />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="auth-btn ">
            Login
          </button>
        </form>
        <p className="auth-p">
          No account? <Link to="/register" className="auth-link">Register</Link>
        </p>
      </div>
    </div>
  )
}