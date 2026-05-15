import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import '../styles/Auth.css'

export default function Register() {
  const [form, setForm] = useState({
    username: '', 
    email: '', 
    password: '', 
    password2: '', 
    first_name: '', 
    last_name: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({...prev, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setErrors(err.response?.data || { detail: 'Registration failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input 
                type="text" 
                name="first_name"
                placeholder="John"
                value={form.first_name}
                onChange={handleChange}
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input 
                type="text" 
                name="last_name"
                placeholder="Doe"
                value={form.last_name}
                onChange={handleChange}
                className="form-input" 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username*</label>
            <input 
              type="text" 
              name="username"
              placeholder="johndoe"
              value={form.username}
              onChange={handleChange}
              className={`form-input ${errors.username? 'error' : ''}`}
              required 
            />
            {errors.username && <p className="error-text">{errors.username}</p>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Email*</label>
            <input 
              type="email" 
              name="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              className={`form-input ${errors.email? 'error' : ''}`}
              required 
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Password*</label>
            <input 
              type="password" 
              name="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={handleChange}
              className={`form-input ${errors.password? 'error' : ''}`}
              required 
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirm Password*</label>
            <input 
              type="password" 
              name="password2"
              placeholder="Re-enter password"
              value={form.password2}
              onChange={handleChange}
              className={`form-input ${errors.password? 'error' : ''}`}
              required 
            />
          </div>
          
          {errors.detail && <p className="error-text">{errors.detail}</p>}
          {errors.non_field_errors && <p className="error-text">{errors.non_field_errors}</p>}
          
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p className="auth-footer">
          Have an account? <Link to="/login" className="auth-link">Login</Link>
        </p>
      </div>
    </div>
  )
}