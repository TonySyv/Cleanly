import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { servicesApi, Service } from '../../api/client'

export default function CustomerServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    servicesApi
      .list()
      .then(setServices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const goToCheckout = (service: Service) => {
    navigate('/checkout', { state: { cart: `${service.id}:1` } })
  }

  if (loading) return <p style={{ color: '#b0b0b0' }}>Loading...</p>
  if (error) return <p style={{ color: '#cf6679' }}>{error}</p>

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Choose services</h2>
      {services.length === 0 ? (
        <p style={{ color: '#b0b0b0' }}>No services available yet.</p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {services.map((s) => (
              <li
                key={s.id}
                style={{
                  background: '#1a1a1a',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{s.name}</strong>
                  {s.description && (
                    <div style={{ color: '#b0b0b0', fontSize: 14 }}>{s.description}</div>
                  )}
                  <div style={{ color: '#00c9a7', fontSize: 14 }}>
                    ${(s.basePriceCents / 100).toFixed(2)} · {s.durationMinutes} min
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => goToCheckout(s)}
                  style={{
                    padding: '8px 16px',
                    background: '#00c9a7',
                    color: '#0d0d0d',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Book
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
