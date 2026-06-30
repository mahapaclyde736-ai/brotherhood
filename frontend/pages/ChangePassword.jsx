import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit() {
    if (form.newPassword !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword })
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
      return
    }

    setMsg('Password changed successfully.')
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  return (
    <div className='auth-container'>
      <h2>Change Password</h2>
      {error && <div className='error'>{error}</div>}
      {msg && <div style={{ color: 'green', marginBottom: 12 }}>{msg}</div>}
      {['currentPassword', 'newPassword', 'confirm'].map((field) => (
        <div className='form-group' key={field}>
          <label>{field}</label>
          <input
            type='password'
            value={form[field]}
            onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
          />
        </div>
      ))}
      <button onClick={handleSubmit} className='btn btn-primary'>Update Password</button>
    </div>
  )
}
