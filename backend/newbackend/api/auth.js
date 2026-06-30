const BASE = 'http://localhost:4000'

async function request(path, method = 'GET', body = null) {
  const options = {
    method,
    credentials: 'include',
    headers: {}
  }

  if (body !== null && body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE}${path}`, options)
  return response.json()
}

export async function login(email, password) {
  try {
    return await request('/api/login', 'POST', { email, password })
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export async function logout() {
  try {
    return await request('/api/logout', 'POST')
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

export async function getMe() {
  try {
    return await request('/api/me')
  } catch (error) {
    console.error('Get me error:', error)
    throw error
  }
}

export async function clockIn() {
  try {
    return await request('/api/clock/in', 'POST')
  } catch (error) {
    console.error('Clock in error:', error)
    throw error
  }
}

export async function clockOut() {
  try {
    return await request('/api/clock/out', 'POST')
  } catch (error) {
    console.error('Clock out error:', error)
    throw error
  }
}

export async function getToday() {
  try {
    return await request('/api/clock/today')
  } catch (error) {
    console.error('Get today error:', error)
    throw error
  }
}

export async function getStatus() {
  try {
    return await request('/api/clock/today')
  } catch (error) {
    console.error('Get status error:', error)
    throw error
  }
}

export async function clockToggle() {
  try {
    return await request('/api/clock/in', 'POST')
  } catch (error) {
    console.error('Clock toggle error:', error)
    throw error
  }
}

export async function getHistory() {
  try {
    return await request('/api/clock/history')
  } catch (error) {
    console.error('Get history error:', error)
    throw error
  }
}

export async function getStaff() {
  try {
    return await request('/api/staff')
  } catch (error) {
    console.error('Get staff error:', error)
    throw error
  }
}

export async function setUserStatus(userId, active) {
  try {
    return await request(`/api/admin/users/${userId}/status`, 'PATCH', { active })
  } catch (error) {
    console.error('Set user status error:', error)
    throw error
  }
}

export async function updateUser(id, data) {
  try {
    return await request(`/api/admin/users/${id}`, 'PUT', data)
  } catch (error) {
    console.error('Update user error:', error)
    throw error
  }
}

export async function deleteClockRecord(recordId) {
  try {
    return await request(`/api/admin/clock/${recordId}`, 'DELETE')
  } catch (error) {
    console.error('Delete clock record error:', error)
    throw error
  }
}

export async function deleteRecord(id) {
  return deleteClockRecord(id)
}

export async function correctClock(id, data) {
  try {
    return await request(`/api/admin/clock/${id}`, 'PUT', data)
  } catch (error) {
    console.error('Correct clock error:', error)
    throw error
  }
}

export async function markAbsence(data) {
  try {
    return await request('/api/admin/absence', 'POST', data)
  } catch (error) {
    console.error('Mark absence error:', error)
    throw error
  }
}

export async function removeAbsence(data) {
  try {
    return await request('/api/admin/absence', 'DELETE', data)
  } catch (error) {
    console.error('Remove absence error:', error)
    throw error
  }
}

export async function getReport(from, to) {
  try {
    return await request(`/api/admin/report?from=${from}&to=${to}`)
  } catch (error) {
    console.error('Get report error:', error)
    throw error
  }
}

export async function getAdminToday() {
  try {
    return await request('/api/admin/today')
  } catch (error) {
    console.error('Get admin today error:', error)
    throw error
  }
}

export async function exportAttendanceCsv() {
  const response = await fetch(`${BASE}/api/admin/export`, {
    method: 'GET',
    credentials: 'include'
  })

  return response.blob()
}

export async function getNotices(page = 1, limit = 6) {
  const response = await fetch(
    `/api/notices?page=${page}&limit=${limit}`,
    {
      method: 'GET',
      credentials: 'include'
    }
  )

  return response.json()
}

export async function createNotice(dataOrTitle, body, is_urgent) {
  try {
    const payload = typeof dataOrTitle === 'string'
      ? { title: dataOrTitle, body, is_urgent }
      : dataOrTitle

    return await request('/api/admin/notices', 'POST', payload)
  } catch (error) {
    console.error('Create notice error:', error)
    throw error
  }
}

export async function updateNotice(id, data) {
  try {
    return await request(`/api/admin/notices/${id}`, 'PUT', data)
  } catch (error) {
    console.error('Update notice error:', error)
    throw error
  }
}

export async function deleteNotice(id) {
  try {
    return await request(`/api/admin/notices/${id}`, 'DELETE')
  } catch (error) {
    console.error('Delete notice error:', error)
    throw error
  }
}
