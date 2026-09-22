import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    if (!password) newErrors.password = 'Password is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setError('')
    setErrors({})

    try {
      await login({ email, password })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" data-aos="fade-up">

        <div className="auth-header">
          <span className="detail-label">Welcome back</span>
          <h1>Log In</h1>
          <p>Sign in to your account to keep shopping.</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <strong>Login Failed</strong>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors({ ...errors, password: '' })
              }}
            />
            {errors.password && <p className="error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Login