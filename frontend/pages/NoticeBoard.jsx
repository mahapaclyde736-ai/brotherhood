import { useState, useEffect } from 'react'
import { getNotices, createNotice, deleteNotice } from '../api'
import Navbar from '../components/Navbar'
import Toast  from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

export default function NoticeBoard() {
  const [notices,  setNotices]  = useState([])
  const [role,     setRole]     = useState('')
  const [userName, setUserName] = useState('')
  const [title,    setTitle]    = useState('')
  const [body,     setBody]     = useState('')
  const [urgent,   setUrgent]   = useState(false)

  const [toast,    setToast]    = useState(null)
  const [confirm,  setConfirm]  = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [deletingIds, setDeletingIds] = useState(new Set())
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // server-side pagination
  const [page, setPage] = useState(1)
  const perPage = 6

  const [validation, setValidation] = useState({})

  useEffect(() => {
    async function fetchNotices() {
      setIsLoading(true)

      try {
        const data = await getNotices(page, perPage)

        if (!data.error) {
          setNotices(data.items || [])

          if (typeof data.total === 'number') {
            setTotalItems(data.total)

            const pages = Math.max(1, Math.ceil(data.total / perPage))
            setTotalPages(pages)

            if (page > pages) {
              setPage(pages)
              return
            }
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotices()
  }, [page])

  useEffect(() => {
    fetch('http://localhost:4000/api/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setRole(data.role)
        setUserName(data.name)
      })
  }, [])

  async function loadNotices() {
    setIsLoading(true)

    try {
      const data = await getNotices(page, perPage)

      if (!data.error) {
        setNotices(data.items || [])

        if (typeof data.total === 'number') {
          setTotalItems(data.total)

          const pages = Math.max(1, Math.ceil(data.total / perPage))
          setTotalPages(pages)

          if (page > pages) {
            setPage(pages)
            return
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // optimistic create: add a temporary item, then reload on success/failure
  async function handlePost() {
    const errs = {}
    if (!title) errs.title = 'Title is required.'
    if (!body)  errs.body  = 'Message is required.'
    setValidation(errs)
    if (Object.keys(errs).length) return

    setIsPosting(true)
    const temp = {
      id: `temp-${Date.now()}`,
      title,
      body,
      is_urgent: urgent,
      author: userName || 'You',
      created_at: new Date().toISOString(),
      _optimistic: true,
    }
    setNotices(prev => [temp, ...prev])
    setTitle(''); setBody(''); setUrgent(false); setValidation({})

    try {
      const result = await createNotice(temp.title, temp.body, temp.is_urgent)
      if (result && result.error) {
        // remove temp and show error
        setNotices(prev => prev.filter(n => n.id !== temp.id))
        setToast({ message: result.error, type: 'error' })
        return
      }
      setToast({ message: 'Notice posted.', type: 'success' })
      // reload to get authoritative data (id, timestamps, author)
      await loadNotices()
    } catch {
      setNotices(prev => prev.filter(n => n.id !== temp.id))
      setToast({ message: 'Failed to post notice.', type: 'error' })
    } finally {
      setIsPosting(false)
    }
  }

  // optimistic delete: remove from UI immediately, restore on error
  function confirmDelete(id) {
    setConfirm({
      message: 'Delete this notice? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirm(null)
        const previous = notices
        setDeletingIds(prev => new Set(prev).add(id))
        setNotices(prev => prev.filter(n => n.id !== id))
        try {
          const res = await deleteNotice(id)
          if (res && res.error) {
            setNotices(previous)
            setToast({ message: res.error, type: 'error' })
            return
          }
          setToast({ message: 'Notice deleted.', type: 'success' })
        } catch {
          setNotices(previous)
          setToast({ message: 'Failed to delete notice.', type: 'error' })
        } finally {
          setDeletingIds(prev => {
            const s = new Set(prev)
            s.delete(id)
            return s
          })
        }
      }
    })
  }

  

  return (
    <>
      <Navbar title='Notice Board' userName={userName} />
      <main className='container'>

        {role === 'admin' && (
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, marginBottom: 28 }}>
            <h2 style={{ color: '#1E3A5F', marginBottom: 16 }}>Post a Notice</h2>
            <div className='form-group'>
              <label>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder='e.g. Staff meeting Friday' />
              {validation.title && <p style={{ color: '#B00020', marginTop: 6 }}>{validation.title}</p>}
            </div>
            <div className='form-group'>
              <label>Message</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder='Write your notice here...' />
              {validation.body && <p style={{ color: '#B00020', marginTop: 6 }}>{validation.body}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <input type='checkbox' id='urgent' checked={urgent} onChange={e => setUrgent(e.target.checked)} />
              <label htmlFor='urgent' style={{ fontWeight: 600, color: '#B85C00' }}>Mark as urgent</label>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={handlePost} className='btn btn-primary' style={{ width: 'auto' }} disabled={isPosting}>
                {isPosting ? 'Posting…' : 'Post Notice'}
              </button>
              {isPosting && <span style={{ color: '#777', fontSize: '0.9rem' }}>Posting notice...</span>}
            </div>
          </div>
        )}

        {isLoading && <p style={{ textAlign: 'center', color: '#777', marginTop: 60 }}>Loading notices…</p>}

        {!isLoading && notices.length === 0 && <p style={{ textAlign: 'center', color: '#777', marginTop: 60 }}>No notices yet.</p>}

        {!isLoading && notices.map(n => (
          <div key={n.id} style={{
            background: '#fff', borderRadius: 10, padding: 24, marginBottom: 16,
            borderLeft: n.is_urgent ? '4px solid #B85C00' : '4px solid #2E75B6',
            opacity: n._optimistic ? 0.85 : 1,
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                {n.is_urgent && (
                  <span style={{ background: '#FFF0DC', color: '#B85C00', fontWeight: 700, padding: '2px 10px', borderRadius: 99, marginBottom: 8, display: 'inline-block' }}>
                    URGENT
                  </span>
                )}
                <h3 style={{ color: '#1E3A5F', marginBottom: 8 }}>{n.title}</h3>
                <p style={{ color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.body}</p>
                <p style={{ color: '#999', fontSize: '0.8rem', marginTop: 12 }}>
                  Posted by {n.author} · {new Date(n.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              {role === 'admin' && (
                <div style={{ marginLeft: 16 }}>
                  <button onClick={() => confirmDelete(n.id)} style={{ background: 'none', border: 'none', color: '#B00020', cursor: 'pointer', fontSize: '1.2rem', marginLeft: 16 }} disabled={deletingIds.has(n.id)}>
                    {deletingIds.has(n.id) ? '…' : '✕'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {!isLoading && totalItems > perPage && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{ fontWeight: page === i + 1 ? 700 : 400 }}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        )}

      </main>
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  )
}
