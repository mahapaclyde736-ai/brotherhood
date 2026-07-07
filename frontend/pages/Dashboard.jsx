/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, getMe } from '../api/auth.js'
// Navbar is provided at the App level; removed to avoid duplicate navigation bars
import ClockCard from '../components/ClockCard.jsx'

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
  const [history, setHistory] = useState([])
  const [userName, setUserName] = useState('')
  const [filter, setFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadHistory()
    getMe()
      .then(data => { if (!data.error) setUserName(data.name) })
      .catch(err => console.error('Failed to fetch user:', err))
  }, [loadHistory])

  async function loadHistory() {
    const data = await getHistory()
    if (data?.error) { navigate('/'); return }
    setHistory(data)
  }

  const filtered = filter
    ? history.filter(r => r.date.startsWith(filter))
    : history

  const totalDays = history.length
  const lateDays = history.filter(r => r.is_late).length
  const onTimeDays = totalDays - lateDays

  return (
    <>
      <main className='container'>
        <ClockCard onClockEvent={loadHistory} />

        <div className='admin-stats' style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
          <div className='stat-card'><h3>{totalDays}</h3><p>Total Days</p></div>
          <div className='stat-card'><h3>{onTimeDays}</h3><p>On Time</p></div>
          <div className='stat-card'><h3>{lateDays}</h3><p>Late</p></div>
        </div>

        <section className='history-section'>
          <div className='table-header'>
            <h2>My Attendance History</h2>
            <input
              type='month'
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <div className="table-wrapper">
            <table>
            <thead>
              <tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)' }}>No records found.</td></tr>
                : filtered.map(r => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{formatTime(r.clock_in)}</td>
                      <td>{formatTime(r.clock_out)}</td>
                      <td>
                        {r.is_late
                          ? <span className='badge-late'>Late</span>
                          : <span className='badge-ontime'>On Time</span>
                        }
                      </td>
                    </tr>
                  ))
              }
            </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  )
}
