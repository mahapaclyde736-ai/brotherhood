export default function ConfirmDialog({ message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: '28px 32px', width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <p style={{ marginBottom: 24, color: '#333', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid #dde3ec', background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: danger ? '#B00020' : '#2E75B6', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
