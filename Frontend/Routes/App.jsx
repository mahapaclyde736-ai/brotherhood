import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'

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

function Dashboard() {
  return (
    <section className="page page-dashboard">
      <h1>Dashboard</h1>
      <p>Here you can track working hours, clock in, and clock out.</p>
    </section>
  )
}

function App() {
  const [userName] = useState('Admin')

  return (
    <>
      <Navbar title="Clock In / Out" userName={userName} />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </>
  )
}

export default App
