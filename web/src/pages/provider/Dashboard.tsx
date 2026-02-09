import { useEffect, useState } from 'react'
import { jobsApi, Job, providerApi, ProviderProfile, servicesApi, Service } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'

export default function ProviderDashboard() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [company, setCompany] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'jobs' | 'profile' | 'company'>('jobs')

  const load = () => {
    setLoading(true)
    Promise.all([
      providerApi.getProfile().then(setProfile).catch(() => setProfile(null)),
      jobsApi.list().then(setJobs).catch(() => setJobs([])),
      servicesApi.list().then(setServices).catch(() => setServices([])),
      providerApi.getCompany().then((c) => setCompany(c)).catch(() => setCompany(null)),
    ])
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateProfile = (data: Partial<ProviderProfile>) => {
    providerApi.updateProfile(data).then(setProfile).catch((e) => setError(e.message))
  }

  const createCompany = () => {
    const name = window.prompt('Company name', 'My Company') || 'My Company'
    providerApi.createCompany(name).then(() => load()).catch((e) => setError(e.message))
  }

  const pickUpJob = (bookingId: string) => {
    jobsApi.create(bookingId).then(() => load()).catch((e) => setError(e.message))
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Provider – {user?.name}</h1>
        <button onClick={() => logout()} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 6, color: '#e8e8e8', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      {error && <div style={{ color: '#cf6679', marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab('jobs')} style={{ padding: '10px 20px', background: tab === 'jobs' ? '#00c9a7' : '#252525', color: tab === 'jobs' ? '#0d0d0d' : '#e8e8e8', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Jobs</button>
        <button onClick={() => setTab('profile')} style={{ padding: '10px 20px', background: tab === 'profile' ? '#00c9a7' : '#252525', color: tab === 'profile' ? '#0d0d0d' : '#e8e8e8', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Profile &amp; Services</button>
        {user?.role === 'COMPANY' && (
          <button onClick={() => setTab('company')} style={{ padding: '10px 20px', background: tab === 'company' ? '#00c9a7' : '#252525', color: tab === 'company' ? '#0d0d0d' : '#e8e8e8', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Company &amp; Employees</button>
        )}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : tab === 'jobs' ? (
        <div>
          <h2>Jobs</h2>
          {jobs.length === 0 ? (
            <p style={{ color: '#b0b0b0' }}>No jobs yet. Jobs appear when you pick up a booking.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {jobs.map((j) => (
                <li key={j.id} style={{ background: '#1a1a1a', padding: 16, borderRadius: 8, marginBottom: 12 }}>
                  <div><strong>{j.booking?.address}</strong></div>
                  <div style={{ color: '#b0b0b0', fontSize: 14 }}>Status: {j.status} · ${j.booking ? (j.booking.totalPriceCents / 100).toFixed(2) : ''}</div>
                  {j.booking?.customer && <div>Customer: {j.booking.customer.name} ({j.booking.customer.email})</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : tab === 'profile' ? (
        <div>
          <h2>Profile &amp; Services</h2>
          <p>Verification: <strong>{profile?.verificationStatus ?? 'PENDING'}</strong></p>
          <p>Offered services (select IDs from the list below and save):</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {services.map((s) => {
              const selected = profile?.offeredServiceIds?.includes(s.id)
              return (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const ids = profile?.offeredServiceIds ?? []
                      const next = e.target.checked ? [...ids, s.id] : ids.filter((id) => id !== s.id)
                      updateProfile({ offeredServiceIds: next })
                    }}
                  />
                  {s.name}
                </label>
              )
            })}
          </div>
        </div>
      ) : (
        <div>
          <h2>Company &amp; Employees</h2>
          {!company ? (
            <button onClick={createCompany} style={{ padding: '10px 20px', background: '#00c9a7', color: '#0d0d0d', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Create company</button>
          ) : (
            <p>Company: <strong>{company.name}</strong></p>
          )}
        </div>
      )}
    </div>
  )
}
