import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, user, token } = useAuth()
  const navigate = useNavigate()

  if (token && user) {
    const role = user.role || 'CUSTOMER'
    if (role === 'PLATFORM_ADMIN') navigate('/admin', { replace: true })
    else if (role === 'PROVIDER' || role === 'COMPANY') navigate('/provider', { replace: true })
    else navigate('/login', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email.trim(), password)
      const u = JSON.parse(localStorage.getItem('user') || '{}') as { role?: string }
      const role = u.role || 'CUSTOMER'
      if (role === 'PLATFORM_ADMIN') navigate('/admin', { replace: true })
      else if (role === 'PROVIDER' || role === 'COMPANY') navigate('/provider', { replace: true })
      else navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '48px auto', padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Cleanly</h1>
      <p style={{ color: '#b0b0b0', marginBottom: 24 }}>
        Admin and provider login. Use an account with role PLATFORM_ADMIN or PROVIDER/COMPANY.
      </p>
      <form onSubmit={handleSubmit}>
        {error && <div style={{ color: '#cf6679', marginBottom: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#1a1a1a',
              border: '1px solid #3a3a3a',
              borderRadius: 6,
              color: '#e8e8e8',
            }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#1a1a1a',
              border: '1px solid #3a3a3a',
              borderRadius: 6,
              color: '#e8e8e8',
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: 12,
            background: '#00c9a7',
            color: '#0d0d0d',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Log in
        </button>
      </form>
    </div>
  )
}
