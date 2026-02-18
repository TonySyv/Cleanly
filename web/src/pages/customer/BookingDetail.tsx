import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { bookingsApi, Booking } from '../../api/client'

export default function CustomerBookingDetail() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) {
      navigate('/bookings', { replace: true })
      return
    }
    bookingsApi
      .get(id)
      .then(setBooking)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const cancel = () => {
    if (!booking || !confirm('Cancel this booking?')) return
    setError('')
    setCancelling(true)
    bookingsApi
      .cancel(booking.id)
      .then((updated) => {
        setBooking(updated)
        setCancelling(false)
      })
      .catch((e) => {
        setError(e.message || 'Cancel failed')
        setCancelling(false)
      })
  }

  if (loading) return <p style={{ color: '#b0b0b0' }}>Loading...</p>
  if (error && !booking) return <p style={{ color: '#cf6679' }}>{error}</p>
  if (!booking) return <p>Booking not found.</p>

  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED'

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Booking details</h2>
      {error && <p style={{ color: '#cf6679', marginBottom: 12 }}>{error}</p>}
      <div style={{ background: '#1a1a1a', padding: 24, borderRadius: 8, marginBottom: 24 }}>
        <p><strong>Address:</strong> {booking.address}</p>
        <p><strong>Status:</strong> {booking.status}</p>
        <p><strong>Scheduled:</strong> {booking.scheduledAt}</p>
        <p><strong>Total:</strong> ${(booking.totalPriceCents / 100).toFixed(2)}</p>
        {booking.customerNotes && <p><strong>Notes:</strong> {booking.customerNotes}</p>}
        <div style={{ marginTop: 16 }}>
          <strong>Services</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            {booking.items.map((item) => (
              <li key={item.id}>
                {item.serviceName || item.serviceId} × {item.quantity} — ${(item.priceCents / 100).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {canCancel && (
        <button
          type="button"
          onClick={cancel}
          disabled={cancelling}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            color: '#cf6679',
            border: '1px solid #cf6679',
            borderRadius: 6,
            cursor: cancelling ? 'not-allowed' : 'pointer',
          }}
        >
          {cancelling ? 'Cancelling...' : 'Cancel booking'}
        </button>
      )}
    </div>
  )
}
