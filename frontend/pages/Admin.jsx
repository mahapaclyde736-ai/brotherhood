import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminToday, updateUser, setUserStatus, deleteRecord, getReport } from '../api/auth.js'
// Navbar is provided at the App level; removed to avoid duplicate navigation bars
import Toast from '../components/Toast.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function Admin() {
  const [staff, setStaff] = useState([])
  const [tab, setTab] = useState('today')
  const [toast, setToast] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [editing, setEditing] = useState(null)
  const [report, setReport] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const navigate = useNavigate()

  const loadStaff = useCallback(async () => {
    const data = await getAdminToday()
    if (data.error) {
      navigate('/')
      return
    }
    setStaff(data)
  }, [navigate])

  useEffect(() => {
    let isActive = true

    const runLoad = async () => {
      const data = await getAdminToday()
      if (!isActive) return
      if (data.error) {
        navigate('/')
        return
      }
      setStaff(data)
    }

    runLoad()

    return () => {
      isActive = false
    }
  }, [navigate])

  async function handleEdit(updates) {
    if (!editing) {
      return
    }

    const result = await updateUser(editing.id, updates)
    if (result.error) {
      setToast({ message: result.error, type: 'error' })
      return
    }
    setToast({ message: 'Details updated.', type: 'success' })
    setEditing(null)
    loadStaff()
  }

  function confirmSuspend(member) {
    const isSuspended = member.active === false
    setConfirm({
      message: isSuspended
        ? `Reactivate ${member.name}'s account?`
        : `Suspend ${member.name}'s account? They will not be able to log in.`,
      confirmLabel: isSuspended ? 'Reactivate' : 'Suspend',
      danger: !isSuspended,
      onConfirm: async () => {
        setConfirm(null)
        await setUserStatus(member.id, !isSuspended)
        setToast({ message: isSuspended ? 'Account reactivated.' : 'Account suspended.', type: 'success' })
        loadStaff()
      }
    })
  }

  function confirmDeleteRecord(recordId) {
    setConfirm({
      message: 'Delete this clock record? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirm(null)
        await deleteRecord(recordId)
        setToast({ message: 'Record deleted.', type: 'success' })
        loadStaff()
      }
    })
  }

  async function loadReport() {
    if (!from || !to) {
      setToast({ message: 'Please select both a start and end date.', type: 'error' })
      return
    }
    const data = await getReport(from, to)
    if (data.error) {
      setToast({ message: data.error, type: 'error' })
      return
    }
    setReport(data)
  }

  const countIn = staff.filter((s) => s.status === 'In').length
  const countOut = staff.filter((s) => s.status === 'Out').length

  return (
    <>
      <main className='container'>
        <div className='admin-stats'>
          <div className='stat-card'><h3>{countIn}</h3><p>Currently In</p></div>
          <div className='stat-card'><h3>{countOut}</h3><p>Currently Out</p></div>
          <div className='stat-card'><h3>{staff.length}</h3><p>Total Staff</p></div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['today', 'report'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px',
                borderRadius: 7,
                cursor: 'pointer',
                fontWeight: 600,
                border: '2px solid #2E75B6',
                background: tab === t ? '#2E75B6' : '#fff',
                color: tab === t ? '#fff' : '#2E75B6',
              }}
            >
              {t === 'today' ? "Today's Attendance" : 'Date Range Report'}
            </button>
          ))}
        </div>

        {tab === 'today' && (
          <>
            <div className='table-header'>
              <h2>Staff Attendance Today</h2>
              <button onClick={() => (window.location.href = '/api/admin/export')} className='btn btn-primary'>
                Export CSV
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Late</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s, i) => (
                  <tr key={i}>
                    <td>{s.name}</td>
                    <td>{s.department}</td>
                    <td className={s.status === 'In' ? 'status-in' : 'status-out'}>{s.status}</td>
                    <td>{formatTime(s.clock_in)}</td>
                    <td>{formatTime(s.clock_out)}</td>
                    <td>{s.is_late ? <span className='badge-late'>Late</span> : '—'}</td>
                    <td>
                      <button
                        onClick={() => setEditing(s)}
                        style={{ fontSize: '0.8rem', padding: '4px 10px', background: '#2E75B6', color: '#fff', marginRight: 6, border: 'none', borderRadius: 5 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmSuspend(s)}
                        style={{ fontSize: '0.8rem', padding: '4px 10px', background: s.active === false ? '#1A6B3A' : '#B00020', color: '#fff', border: 'none', borderRadius: 5 }}
                      >
                        {s.active === false ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'report' && (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>From</label>
                <input type='date' value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>To</label>
                <input type='date' value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <button onClick={loadReport} className='btn btn-primary' style={{ width: 'auto' }}>
                Load Report
              </button>
            </div>
            {report.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Dept</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Late</th>
                    <th>Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>{r.department}</td>
                      <td>{r.date}</td>
                      <td>{formatTime(r.clock_in)}</td>
                      <td>{formatTime(r.clock_out)}</td>
                      <td>{r.is_late ? <span className='badge-late'>Late</span> : '—'}</td>
                      <td>{r.record_type || 'attendance'}</td>
                      <td>
                        <button onClick={() => confirmDeleteRecord(r.id || r._id)} style={{ fontSize: '0.8rem', padding: '4px 10px', background: '#B00020', color: '#fff', border: 'none', borderRadius: 5 }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>

      {editing && <EditModal member={editing} onClose={() => setEditing(null)} onSave={handleEdit} />}
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  )
}

function EditModal({ member, onClose, onSave }) {
  const [name, setName] = useState(member.name)
  const [email, setEmail] = useState(member.email)
  const [department, setDepartment] = useState(member.department)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 420 }}>
        <h3 style={{ marginBottom: 20, color: '#1E3A5F' }}>Edit {member.name}</h3>
        {[['Name', name, setName], ['Email', email, setEmail], ['Department', department, setDepartment]].map(([label, val, setter]) => (
          <div key={label} className='form-group'>
            <label>{label}</label>
            <input value={val} onChange={(e) => setter(e.target.value)} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onSave({ name, email, department })} className='btn btn-primary'>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
