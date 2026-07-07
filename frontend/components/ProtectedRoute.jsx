import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../api/auth.js'

export default function ProtectedRoute({ children, role }) {
  const [auth, setAuth] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Request the current user session from the server
    getMe()
      .then((data) => {
        // If the user is not authenticated, redirect to login
        if (data.error) {
          navigate('/login')
          return
        }

        // If the route requires a specific role, enforce it
        if (role && data.role !== role) {
          navigate('/login')
          return
        }

        // Store authenticated user information for render
        setAuth(data)
      })
      .catch((error) => {
        console.error('Auth check failed:', error)
        navigate('/login')
      })
  }, [navigate, role])

  if (auth === null) {
    // While the auth state is resolving, display a loading indicator
    return <p>Loading...</p>
  }

  // Once verified, render the protected children
  return children
}
