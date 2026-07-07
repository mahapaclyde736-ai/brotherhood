import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth.js'

export default function Navbar({ title, userName }) {
  const navigate = useNavigate()
  const isAuthenticated = Boolean(userName)

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className='navbar'>
      <span className='nav-title'>{title}</span>
      <div className='nav-right'>
        <Link to='/' className='nav-link'>Home</Link>
        {isAuthenticated ? (
          <>
            <Link to='/dashboard' className='nav-link'>Dashboard</Link>
            <Link to='/notices' className='nav-link'>Notice Board</Link>
            <Link to='/change-password' className='nav-link'>Change Password</Link>
            <span className='nav-user'>{userName}</span>
            <button onClick={handleLogout} className='btn btn-secondary'>
              Log Out
            </button>
          </>
        ) : (
          <Link to='/login' className='btn btn-primary'>Log In</Link>
        )}
      </div>
    </nav>
  )
}
