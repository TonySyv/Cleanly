import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bookingsApi, Booking } from '../../api/client'

export default function CustomerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    bookingsApi
      .list()
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <p style={{ color: '#b0b0b0' }}>Loading...</p>
  if (error) return <p style={{ color: '#cf6679' }}>{error}</p>

  if (bookings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#b0b0b0', marginBottom: 16 }}>No bookings yet.</p>
        <button
          type="button"
          onClick={() => navigate('/services')}
          style={{
            padding: '12px 24px',
            background: '#00c9a7',
            color: '#0d0d0d',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Book cleaning
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>My bookings</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {bookings.map((b) => (
          <li key={b.id} style={{ marginBottom: 12 }}>
            <Link
              to={`/bookings/${b.id}`}
              style={{
                display: 'block',
                background: '#1a1a1a',
                padding: 16,
                borderRadius: 8,
                color: '#e8e8e8',
                textDecoration: 'none',
              }}
            >
              <div><strong>{b.address}</strong></div>
              <div style={{ color: '#b0b0b0', fontSize: 14 }}>
                {b.status} · {b.scheduledAt.slice(0, 10)}
              </div>
              <div style={{ color: '#00c9a7' }}>${(b.totalPriceCents / 100).toFixed(2)}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
