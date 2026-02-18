import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { bookingsApi, servicesApi, Service, Booking } from '../../api/client'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

function StripePayForm({
  bookingId,
  onSuccess,
  onError,
  confirming,
  setConfirming,
}: {
  bookingId: string
  onSuccess: () => void
  onError: (msg: string) => void
  confirming: boolean
  setConfirming: (v: boolean) => void
}) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setConfirming(true)
    onError('')
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/bookings' },
    })
    if (error) {
      onError(error.message || 'Payment failed')
      setConfirming(false)
      return
    }
    try {
      await bookingsApi.confirmPayment(bookingId)
      onSuccess()
    } catch (e) {
      onError((e as Error).message || 'Confirmation failed')
    }
    setConfirming(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || confirming}
        style={{
          marginTop: 16,
          padding: '12px 24px',
          background: !stripe || confirming ? '#252525' : '#00c9a7',
          color: '#0d0d0d',
          border: 'none',
          borderRadius: 6,
          cursor: !stripe || confirming ? 'not-allowed' : 'pointer',
        }}
      >
        {confirming ? 'Confirming...' : 'Pay'}
      </button>
    </form>
  )
}

export default function CustomerCheckout() {
  const [address, setAddress] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const cartStr = (location.state as { cart?: string } | null)?.cart ?? ''
  const [cartItems, setCartItems] = useState<Array<{ service: Service; quantity: number }>>([])

  useEffect(() => {
    if (!cartStr) {
      navigate('/services', { replace: true })
      return
    }
    const parts = cartStr.split(',').map((p) => p.trim())
    const items: Array<{ serviceId: string; quantity: number }> = []
    for (const p of parts) {
      const [id, qty] = p.split(':')
      if (id && qty) items.push({ serviceId: id.trim(), quantity: Math.max(1, parseInt(qty, 10) || 1) })
    }
    if (items.length === 0) {
      navigate('/services', { replace: true })
      return
    }
    servicesApi
      .list()
      .then((services) => {
        const map = new Map(services.map((s) => [s.id, s]))
        const list = items
          .map(({ serviceId, quantity }) => ({
            service: map.get(serviceId)!,
            quantity,
          }))
          .filter((c) => c.service)
        setCartItems(list)
        if (list.length === 0) navigate('/services', { replace: true })
      })
      .catch(() => setError('Failed to load services'))
  }, [cartStr, navigate])

  const totalCents = cartItems.reduce((sum, c) => sum + c.service.basePriceCents * c.quantity, 0)

  const createBooking = () => {
    setError('')
    if (!address.trim()) {
      setError('Enter address')
      return
    }
    let scheduled: string
    if (scheduledAt.trim()) {
      const d = new Date(scheduledAt.trim())
      if (Number.isNaN(d.getTime())) {
        setError('Invalid date format. Use ISO format or leave blank for tomorrow.')
        return
      }
      scheduled = d.toISOString()
    } else {
      scheduled = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
    setError('')
    setLoading(true)
    bookingsApi
      .create({
        scheduledAt: scheduled,
        address: address.trim(),
        customerNotes: customerNotes.trim() || undefined,
        items: cartItems.map((c) => ({ serviceId: c.service.id, quantity: c.quantity })),
      })
      .then((booking) => {
        setCreatedBooking(booking)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message || 'Failed to create booking')
        setLoading(false)
      })
  }

  const confirmPayment = () => {
    if (!createdBooking) return
    setError('')
    setConfirming(true)
    bookingsApi
      .confirmPayment(createdBooking.id)
      .then(() => {
        setSuccess(true)
        setConfirming(false)
        setTimeout(() => navigate('/bookings', { replace: true }), 2000)
      })
      .catch((e) => {
        setError(e.message || 'Confirmation failed')
        setConfirming(false)
      })
  }

  // When backend returns clientSecret and we have Stripe key, show Stripe form; otherwise single button (dummy or "Confirm booking").
  const useStripeForm = Boolean(createdBooking?.clientSecret && stripePromise)

  if (success) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2 style={{ color: '#00c9a7' }}>Booking confirmed</h2>
        <p>Your cleaning is booked. Redirecting to My bookings...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Checkout</h2>
      {error && <p style={{ color: '#cf6679', marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'grid', gap: 12, maxWidth: 400, marginBottom: 24 }}>
        <label>
          <div style={{ marginBottom: 4, color: '#b0b0b0' }}>Address</div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city, postal code"
            style={{
              width: '100%',
              padding: 10,
              background: '#0d0d0d',
              border: '1px solid #3a3a3a',
              borderRadius: 6,
              color: '#e8e8e8',
            }}
          />
        </label>
        <label>
          <div style={{ marginBottom: 4, color: '#b0b0b0' }}>Date & time (ISO or leave blank for tomorrow)</div>
          <input
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            placeholder="e.g. 2025-02-18T10:00:00"
            style={{
              width: '100%',
              padding: 10,
              background: '#0d0d0d',
              border: '1px solid #3a3a3a',
              borderRadius: 6,
              color: '#e8e8e8',
            }}
          />
        </label>
        <label>
          <div style={{ marginBottom: 4, color: '#b0b0b0' }}>Notes (optional)</div>
          <input
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              background: '#0d0d0d',
              border: '1px solid #3a3a3a',
              borderRadius: 6,
              color: '#e8e8e8',
            }}
          />
        </label>
      </div>
      <p style={{ marginBottom: 16 }}>
        Total: <strong>${(totalCents / 100).toFixed(2)}</strong>
      </p>
      {!createdBooking ? (
        <button
          type="button"
          onClick={createBooking}
          disabled={loading || cartItems.length === 0}
          style={{
            padding: '12px 24px',
            background: loading ? '#252525' : '#00c9a7',
            color: '#0d0d0d',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : 'Create booking'}
        </button>
      ) : useStripeForm && createdBooking.clientSecret ? (
        <Elements stripe={stripePromise!} options={{ clientSecret: createdBooking.clientSecret, appearance: { theme: 'night' } }}>
          <StripePayForm
            bookingId={createdBooking.id}
            onSuccess={() => {
              setSuccess(true)
              setTimeout(() => navigate('/bookings', { replace: true }), 2000)
            }}
            onError={(msg) => setError(msg)}
            confirming={confirming}
            setConfirming={setConfirming}
          />
        </Elements>
      ) : (
        <button
          type="button"
          onClick={confirmPayment}
          disabled={confirming}
          style={{
            padding: '12px 24px',
            background: confirming ? '#252525' : '#00c9a7',
            color: '#0d0d0d',
            border: 'none',
            borderRadius: 6,
            cursor: confirming ? 'not-allowed' : 'pointer',
          }}
        >
          {confirming ? 'Confirming...' : createdBooking.clientSecret ? 'Confirm payment (Stripe key not set)' : 'Confirm booking'}
        </button>
      )}
    </div>
  )
}
