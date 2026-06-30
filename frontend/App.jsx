import { useState, useEffect } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
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
      <h1>Welcome to ClockInClockOut</h1>
      <p>Use the navbar to sign out and navigate through the app.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Go to Dashboard
      </Link>
    </section>
  )
}

function App() {
  const [userName, setUserName] = useState('')

  useEffect(() => {
    getMe()
      .then(data => { if (!data.error) setUserName(data.name) })
      .catch(err => console.error('Failed to fetch user:', err))
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
