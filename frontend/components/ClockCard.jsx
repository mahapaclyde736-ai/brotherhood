import { useState, useEffect } from 'react'
import { getStatus, clockIn, clockOut } from '../api/auth.js'

const formatTime = iso =>
  iso
    ? new Date(iso).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—'

export default function ClockCard({ onClockEvent }) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-GB')
  )

  const [isClockedIn, setIsClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState(null)
  const [clockOutTime, setClockOutTime] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lateBanner, setLateBanner] = useState(false)

  const loadStatus = async () => {
    try {
      const data = await getStatus()

      // Server returns clock_in / clock_out / is_late fields.
      // Map them into the component's expected shape.
      const clockInIso = data?.clock_in || null
      const clockOutIso = data?.clock_out || null

      // Consider user clocked in only when they have a clock_in and no clock_out yet
      setIsClockedIn(Boolean(clockInIso && !clockOutIso))
      setClockInTime(clockInIso)
      setClockOutTime(clockOutIso)
    } catch (error) {
      console.error('Failed to load status:', error)
    }
  }

  useEffect(() => {
    ;(async () => {
      await loadStatus()
    })()

    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB'))
    }, 1000)

    return () => clearInterval(id)
  }, [])

  const handleClock = async () => {
    try {
      setLoading(true)

      // call the explicit endpoint depending on current state
      if (isClockedIn) {
        await clockOut()
      } else {
        await clockIn()
      }

      // backend returns simple { ok: true } for clock actions; now reload status
      const status = await getStatus()
      setLateBanner(Boolean(status?.is_late && status?.clock_in && !status?.clock_out))

      // update UI with latest state
      const clockInIso = status?.clock_in || null
      const clockOutIso = status?.clock_out || null
      setIsClockedIn(Boolean(clockInIso && !clockOutIso))
      setClockInTime(clockInIso)
      setClockOutTime(clockOutIso)

      onClockEvent?.()
    } catch (error) {
      console.error('Clock action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="clock-card">
      {lateBanner && (
        <div className="late-banner">
          You have been marked as late today. Please speak to your administrator.
        </div>
      )}

      <div className="current-time">{time}</div>

      {clockOutTime && !isClockedIn && (
        <div className="clocked-out-notice" style={{ marginTop: 8, color: 'var(--muted)' }}>
          Clocked out at <strong>{formatTime(clockOutTime)}</strong>
        </div>
      )}

      <div className="clock-status">
        {isClockedIn ? (
          <>
            Clocked in since{' '}
            <strong>{formatTime(clockInTime)}</strong>
          </>
        ) : (
          'You are currently clocked out'
        )}
      </div>

      <button
        onClick={handleClock}
        disabled={loading}
        className="btn btn-primary clock-btn"
      >
        {loading
          ? 'Please wait...'
          : isClockedIn
          ? 'Clock Out'
          : 'Clock In'}
      </button>
    </div>
  )
}

