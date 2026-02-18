import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import AdminServices from './pages/admin/Services'
import ProviderDashboard from './pages/provider/Dashboard'
import CustomerLayout from './pages/customer/CustomerLayout'
import CustomerServices from './pages/customer/Services'
import CustomerCheckout from './pages/customer/Checkout'
import CustomerBookings from './pages/customer/Bookings'
import CustomerBookingDetail from './pages/customer/BookingDetail'
import CustomerProfile from './pages/customer/Profile'

function Protected({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, token, isLoading } = useAuth()
  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!token || !user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role || 'CUSTOMER')) {
    return <div style={{ padding: 24 }}>Access denied. Your role: {user.role}</div>
  }
  return <>{children}</>
}

function CustomerGate() {
  const { user, token, isLoading } = useAuth()
  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!token || !user) return <Navigate to="/login" replace />
  const role = user.role || 'CUSTOMER'
  if (role === 'PLATFORM_ADMIN') return <Navigate to="/admin" replace />
  if (role === 'PROVIDER' || role === 'COMPANY') return <Navigate to="/provider" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<CustomerGate />}>
        <Route element={<CustomerLayout />}>
          <Route index element={<Navigate to="/services" replace />} />
          <Route path="services" element={<CustomerServices />} />
          <Route path="checkout" element={<CustomerCheckout />} />
          <Route path="bookings" element={<CustomerBookings />} />
          <Route path="bookings/:id" element={<CustomerBookingDetail />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>
      </Route>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
