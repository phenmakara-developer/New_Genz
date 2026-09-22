import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Enter a valid email'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    if (!confirm) {
      newErrors.confirm = 'Please confirm your password'
    } else if (password !== confirm) {
      newErrors.confirm = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setError('')
    setErrors({})

    try {
      await register({ name, email, password })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" data-aos="fade-up">

        <div className="auth-header">
          <span className="detail-label">Join Genz.Wear</span>
          <h1>Create Account</h1>
          <p>Register to track orders and shop faster.</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <strong>Registration Failed</strong>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              className={errors.name ? 'input-error' : ''}
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors({ ...errors, name: '' })
              }}
            />
            {errors.name && <p className="error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              className={errors.email ? 'input-error' : ''}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors({ ...errors, email: '' })
              }}
            />
            {errors.email && <p className="error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className={errors.password ? 'input-error' : ''}
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors({ ...errors, password: '' })
              }}
            />
            {errors.password && <p className="error">{errors.password}</p>}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              className={errors.confirm ? 'input-error' : ''}
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setErrors({ ...errors, confirm: '' })
              }}
            />
            {errors.confirm && <p className="error">{errors.confirm}</p>}
          </div>

          <button type="submit" className="btn btn-block" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Register