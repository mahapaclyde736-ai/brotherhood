import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminToday } from '../api/auth.js'
import Navbar from '../components/Navbar.jsx'

const formatTime = iso =>
  iso
    ? new Date(iso).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—'

export default function Admin() {
  const [staff, setStaff] = useState([])
  const navigate = useNavigate()

  const loadStaff = async () => {
    try {
      const data = await getAdminToday()

      if (data.error) {
        navigate('/')
        return
      }

      setStaff(data)
    } catch (error) {
      console.error('Failed to load staff:', error)
      navigate('/')
    }
  }

  useEffect(() => {
    ;(async () => {
      await loadStaff()
    })()
  }, [])

  const countIn = staff.filter(s => s.status === 'In').length
  const countOut = staff.filter(s => s.status === 'Out').length

  return (
    <>
      <Navbar title="Admin Panel" />

      <main className="container">
        <div className="admin-stats">
          <div className="stat-card">
            <h3>{countIn}</h3>
            <p>Currently In</p>
          </div>

          <div className="stat-card">
            <h3>{countOut}</h3>
            <p>Currently Out</p>
          </div>

          <div className="stat-card">
            <h3>{staff.length}</h3>
            <p>Total Staff</p>
          </div>
        </div>

        <div className="table-header">
          <h2>Staff Attendance Today</h2>

          <button
            className="btn btn-primary"
            onClick={() => (window.location.href = '/api/admin/export')}
          >
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
            </tr>
          </thead>

          <tbody>
            {staff.map(
              ({
                id,
                name,
                department,
                status,
                clock_in,
                clock_out,
                is_late
              }) => (
                <tr key={id}>
                  <td>{name}</td>
                  <td>{department}</td>

                  <td
                    className={
                      status === 'In'
                        ? 'status-in'
                        : 'status-out'
                    }
                  >
                    {status}
                  </td>

                  <td>{formatTime(clock_in)}</td>
                  <td>{formatTime(clock_out)}</td>

                  <td>
                    {is_late ? (
                      <span className="badge-late">
                        Late
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </main>
    </>
  )
}
