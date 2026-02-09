import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import AdminServices from './pages/admin/Services'
import ProviderDashboard from './pages/provider/Dashboard'

function Protected({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, token, isLoading } = useAuth()
  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!token || !user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role || 'CUSTOMER')) {
    return <div style={{ padding: 24 }}>Access denied. Your role: {user.role}</div>
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin/*"
        element={
          <Protected allowedRoles={['PLATFORM_ADMIN']}>
            <AdminServices />
          </Protected>
        }
      />
      <Route
        path="/provider/*"
        element={
          <Protected allowedRoles={['PROVIDER', 'COMPANY']}>
            <ProviderDashboard />
          </Protected>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
