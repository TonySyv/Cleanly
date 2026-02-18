const API_BASE = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('accessToken')
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export type User = { id: string; email: string; name: string; role?: string }
export type AuthResponse = { accessToken: string; refreshToken: string; user: User }

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, name: string, role?: string) =>
    api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role: role || 'CUSTOMER' }),
    }),
}

export const usersApi = {
  get: (id: string) => api<User>(`/users/${id}`),
  update: (id: string, data: { name?: string; avatarUrl?: string }) =>
    api<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}

export type Service = {
  id: string
  name: string
  description: string | null
  basePriceCents: number
  durationMinutes: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export const adminServicesApi = {
  list: () => api<Service[]>('/admin/services'),
  create: (data: { name: string; description?: string; basePriceCents: number; durationMinutes: number; active?: boolean }) =>
    api<Service>('/admin/services', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Service>) =>
    api<Service>(`/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => api<void>(`/admin/services/${id}`, { method: 'DELETE' }),
}

export const servicesApi = { list: () => api<Service[]>('/services') }

// Customer bookings
export type BookingItem = {
  id: string
  serviceId: string
  serviceName: string | null
  quantity: number
  priceCents: number
}

export type Booking = {
  id: string
  customerId: string
  status: string
  scheduledAt: string
  address: string
  customerNotes: string | null
  totalPriceCents: number
  stripePaymentIntentId: string | null
  clientSecret?: string
  createdAt: string
  updatedAt: string
  items: BookingItem[]
  job?: { id: string; status: string; providerId: string; companyId?: string | null; assignedEmployeeId?: string | null }
  provider?: { id: string; name: string; email: string }
}

export type CreateBookingItem = { serviceId: string; quantity: number }
export type CreateBookingRequest = {
  scheduledAt: string
  address: string
  customerNotes?: string
  items: CreateBookingItem[]
}

export const bookingsApi = {
  list: () => api<Booking[]>('/bookings'),
  get: (id: string) => api<Booking>(`/bookings/${id}`),
  create: (data: CreateBookingRequest) =>
    api<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: string) =>
    api<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  confirmPayment: (id: string) =>
    api<Booking>(`/bookings/${id}/confirm-payment`, { method: 'POST' }),
}

export type Job = {
  id: string
  bookingId: string
  providerId: string
  status: string
  booking?: {
    id: string
    status: string
    scheduledAt: string
    address: string
    totalPriceCents: number
    customer?: { id: string; name: string; email: string }
    items?: Array<{ serviceName?: string; quantity: number; priceCents: number }>
  }
}

export const jobsApi = {
  list: () => api<Job[]>('/jobs'),
  create: (bookingId: string) =>
    api<Job>('/jobs', { method: 'POST', body: JSON.stringify({ bookingId }) }),
  update: (id: string, data: { status?: string; assignedEmployeeId?: string | null }) =>
    api<Job>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

export type ProviderProfile = {
  id?: string
  userId?: string
  verificationStatus: string
  documentUrls: string[]
  offeredServiceIds: string[]
  createdAt?: string
  updatedAt?: string
}

export const providerApi = {
  getProfile: () => api<ProviderProfile>('/provider/profile'),
  updateProfile: (data: Partial<ProviderProfile>) =>
    api<ProviderProfile>('/provider/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getCompany: () => api<{ id: string; name: string; ownerId: string } | null>('/provider/company'),
  createCompany: (name: string) =>
    api<{ id: string; name: string }>('/provider/company', { method: 'POST', body: JSON.stringify({ name }) }),
  getEmployees: () =>
    api<Array<{ id: string; userId: string; role: string; user: { id: string; name: string; email: string } }>>('/provider/employees'),
  addEmployee: (data: { email: string; name?: string; password?: string; role?: string }) =>
    api<unknown>('/provider/employees', { method: 'POST', body: JSON.stringify(data) }),
  removeEmployee: (id: string) => api<void>(`/provider/employees/${id}`, { method: 'DELETE' }),
}
