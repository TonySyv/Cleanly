import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Menu visibility by role: see PERMISSIONS.md (customer layout = Book cleaning, My bookings, Profile).

const navStyle = {
  display: 'flex',
  gap: 8,
  marginBottom: 24,
  flexWrap: 'wrap' as const,
}
const linkStyle = (active: boolean) => ({
  padding: '10px 20px',
  background: active ? '#00c9a7' : '#252525',
  color: active ? '#0d0d0d' : '#e8e8e8',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  textDecoration: 'none',
  font: 'inherit',
})
const logoutBtn = {
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid #3a3a3a',
  borderRadius: 6,
  color: '#b0b0b0',
  cursor: 'pointer',
  marginLeft: 'auto',
}

export default function CustomerLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Cleanly</h1>
        <nav style={navStyle}>
          <NavLink to="/services" style={({ isActive }) => linkStyle(isActive)}>
            Book cleaning
          </NavLink>
          <NavLink to="/bookings" style={({ isActive }) => linkStyle(isActive)}>
            My bookings
          </NavLink>
          <NavLink to="/profile" style={({ isActive }) => linkStyle(isActive)}>
            Profile
          </NavLink>
        </nav>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
          style={logoutBtn}
        >
          Log out
        </button>
      </div>
      <Outlet />
    </div>
  )
}
