import { useNavigate } from 'react-router-dom'
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
        <button onClick={handleLogout} className='btn btn-secondary'>
          Log Out
        </button>
      </div>
    </nav>
  )
}
