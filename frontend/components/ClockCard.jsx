import { useState, useEffect } from 'react'
import { getStatus, clockToggle } from '../api/auth.js'

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
  const [loading, setLoading] = useState(false)
  const [lateBanner, setLateBanner] = useState(false)

  const loadStatus = async () => {
    try {
      const data = await getStatus()

      setIsClockedIn(data.isClockedIn)
      setClockInTime(data.clockInTime)
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

      const data = await clockToggle()

      setLateBanner(
        data.action === 'clocked_in' && data.isLate
      )

      await loadStatus()

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
