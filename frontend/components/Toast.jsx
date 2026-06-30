import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000)
    return () => clearTimeout(id)
  }, [onClose])

  const colours = {
    success: { bg: '#D6F0E0', border: '#1A6B3A', text: '#1A6B3A' },
    error: { bg: '#FDECEA', border: '#B00020', text: '#B00020' },
    info: { bg: '#EBF3FB', border: '#2E75B6', text: '#1E3A5F' }
  }
  const c = colours[type] || colours.info

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28,
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderLeft: `4px solid ${c.border}`,
      borderRadius: 8, padding: '14px 20px',
      fontWeight: 600, fontSize: '0.9rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      zIndex: 9999,
    }}>
      {message}
    </div>
  )
}
