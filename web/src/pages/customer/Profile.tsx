import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usersApi, User } from '../../api/client'

export default function CustomerProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [editedName, setEditedName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) {
      setProfile(user ?? null)
      setLoading(false)
      return
    }
    usersApi
      .get(user.id)
      .then((u) => {
        setProfile(u)
        setEditedName(u.name)
      })
      .catch(() => setProfile(user))
      .finally(() => setLoading(false))
  }, [user?.id])

  const save = () => {
    if (!profile?.id || editedName.trim() === profile.name) return
    setError('')
    setSaving(true)
    usersApi
      .update(profile.id, { name: editedName.trim() })
      .then((u) => {
        setProfile(u)
        setEditedName(u.name)
        setSaving(false)
      })
      .catch((e) => {
        setError(e.message || 'Save failed')
        setSaving(false)
      })
  }

  if (loading) return <p style={{ color: '#b0b0b0' }}>Loading...</p>
  if (!profile) return <p>Profile not found.</p>

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Profile</h2>
      {error && <p style={{ color: '#cf6679', marginBottom: 12 }}>{error}</p>}
      <div style={{ maxWidth: 400 }}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <div style={{ marginBottom: 4, color: '#b0b0b0' }}>Name</div>
          <input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
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
        <p style={{ color: '#b0b0b0' }}>Email: {profile.email}</p>
        <button
          type="button"
          onClick={save}
          disabled={saving || editedName.trim() === profile.name}
          style={{
            padding: '10px 20px',
            background: editedName.trim() !== profile.name ? '#00c9a7' : '#252525',
            color: '#0d0d0d',
            border: 'none',
            borderRadius: 6,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
