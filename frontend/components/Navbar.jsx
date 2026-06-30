import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth.js'

export default function Navbar({ title, userName }) {
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className='navbar'>
      <span className='nav-title'>{title}</span>
      <div className='nav-right'>
        {userName && <span className='nav-user'>{userName}</span>}
        <button
          type='button'
          className='btn btn-secondary'
          onClick={() => navigate('/change-password')}
        >
          Change Password
        </button>
        <Link
          to='/notices'
          style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', textDecoration: 'none' }}
        >
          Notice Board
        </Link>
        <button onClick={handleLogout} className='btn btn-secondary'>
          Log Out
        </button>
      </div>
    </nav>
  )
}
