import { useEffect, useState } from 'react'
import { adminServicesApi, Service } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState({ name: '', description: '', basePriceCents: 0, durationMinutes: 60 })
  const { logout } = useAuth()

  const load = () => {
    setLoading(true)
    adminServicesApi.list()
      .then(setServices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name.trim()) return
    setError('')
    try {
      if (editing) {
        await adminServicesApi.update(editing.id, {
          name: form.name,
          description: form.description || null,
          basePriceCents: form.basePriceCents,
          durationMinutes: form.durationMinutes,
        })
      } else {
        await adminServicesApi.create({
          name: form.name,
          description: form.description || null,
          basePriceCents: form.basePriceCents,
          durationMinutes: form.durationMinutes,
        })
      }
      setEditing(null)
      setForm({ name: '', description: '', basePriceCents: 0, durationMinutes: 60 })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Deactivate or delete this service?')) return
    try {
      await adminServicesApi.remove(id)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Admin – Services</h1>
        <button onClick={() => logout()} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 6, color: '#e8e8e8', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      {error && <div style={{ color: '#cf6679', marginBottom: 12 }}>{error}</div>}
      <div style={{ background: '#1a1a1a', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>{editing ? 'Edit service' : 'Add service'}</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={{ padding: 10, background: '#0d0d0d', border: '1px solid #3a3a3a', borderRadius: 6, color: '#e8e8e8' }}
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            style={{ padding: 10, background: '#0d0d0d', border: '1px solid #3a3a3a', borderRadius: 6, color: '#e8e8e8' }}
          />
          <input
            type="number"
            placeholder="Price (cents)"
            value={form.basePriceCents || ''}
            onChange={(e) => setForm((f) => ({ ...f, basePriceCents: parseInt(e.target.value, 10) || 0 }))}
            style={{ padding: 10, background: '#0d0d0d', border: '1px solid #3a3a3a', borderRadius: 6, color: '#e8e8e8' }}
          />
          <input
            type="number"
            placeholder="Duration (min)"
            value={form.durationMinutes || ''}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value, 10) || 0 }))}
            style={{ padding: 10, background: '#0d0d0d', border: '1px solid #3a3a3a', borderRadius: 6, color: '#e8e8e8' }}
          />
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={save} style={{ padding: '10px 20px', background: '#00c9a7', color: '#0d0d0d', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            {editing ? 'Update' : 'Create'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ name: '', description: '', basePriceCents: 0, durationMinutes: 60 }) }} style={{ padding: '10px 20px', background: '#3a3a3a', color: '#e8e8e8', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #3a3a3a' }}>
              <th style={{ textAlign: 'left', padding: 12 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Price</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Duration</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Active</th>
              <th style={{ padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #252525' }}>
                <td style={{ padding: 12 }}>{s.name}</td>
                <td style={{ padding: 12 }}>${(s.basePriceCents / 100).toFixed(2)}</td>
                <td style={{ padding: 12 }}>{s.durationMinutes} min</td>
                <td style={{ padding: 12 }}>{s.active ? 'Yes' : 'No'}</td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => { setEditing(s); setForm({ name: s.name, description: s.description || '', basePriceCents: s.basePriceCents, durationMinutes: s.durationMinutes }) }} style={{ marginRight: 8, padding: '6px 12px', background: '#252525', border: 'none', borderRadius: 4, color: '#00c9a7', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => remove(s.id)} style={{ padding: '6px 12px', background: '#252525', border: 'none', borderRadius: 4, color: '#cf6679', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
