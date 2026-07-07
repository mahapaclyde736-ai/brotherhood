import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import './index.css'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ChangePassword from './pages/Changepassword.jsx'
import NoticeBoard from './pages/NoticeBoard.jsx'
import { getMe } from './api/auth.js'

function Home() {
  return (
    <section className="page page-home">
      <div className="container">
        <h1>Welcome to ClockInClockOut</h1>
        <p className="lead">Quickly track your attendance, see your history, and stay on top of notices — all in one simple app.</p>

        <div className="cta-row">
          <Link to="/dashboard" className="btn btn-primary btn-cta">Go to Dashboard</Link>
          <Link to="/login" className="btn btn-cta" style={{ background: 'transparent', border: '1px solid rgba(30,58,95,0.08)', color: 'var(--primary)' }}>Sign In</Link>
        </div>
      </div>
    </section>
  )
}

function App() {
  const [userName, setUserName] = useState('')
  const isAuthenticated = Boolean(userName)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMe()
        if (!data.error) {
          setUserName(data.name)
        } else {
          setUserName('')
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
        setUserName('')
      }
    }

    fetchUser()

    const handleAuthChanged = () => {
      fetchUser()
    }

    window.addEventListener('authChanged', handleAuthChanged)
    return () => window.removeEventListener('authChanged', handleAuthChanged)
  }, [])

  return (
    <>
      <Navbar title="Clock In / Out" userName={userName} />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notices"
            element={
              <ProtectedRoute>
                <NoticeBoard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}

export default App
