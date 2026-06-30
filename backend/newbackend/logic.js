import express from 'express'
import UsersModel from './models/user.js'
import HashPassword, { verifyPassword } from './auth/encryptPassword.js'
import { requireLogin, requireAdmin } from './middleware/auth.js'
import { pool } from './db/connection.js'

const router = express.Router()

function todayString() {
  return new Date().toISOString().split('T')[0]
}

router.post('/users', CreateUser)
router.put('/users/:id', UpdateUserByID)
router.delete('/users/:id', DeleteUserById)
router.delete('/users', DeleteAllUsers)
router.post('/login', LoginUser)
router.post('/logout', LogoutUser)
router.get('/me', requireLogin, GetMe)
router.post('/clock/in', requireLogin, ClockIn)
router.post('/clock/out', requireLogin, ClockOut)
router.get('/clock/today', requireLogin, GetTodayClock)
router.get('/admin/today', requireLogin, requireAdmin, GetAdminToday)
router.get('/admin/export', requireLogin, requireAdmin, ExportAttendanceCsv)
router.get('/admin/report', requireLogin, requireAdmin, GetAdminReport)
router.get('/notices', requireLogin, GetNotices)
router.post('/admin/notices', requireLogin, requireAdmin, CreateNotice)
router.put('/admin/notices/:id', requireLogin, requireAdmin, UpdateNotice)
router.delete('/admin/notices/:id', requireLogin, requireAdmin, DeleteNotice)
router.put('/admin/users/:id', requireLogin, requireAdmin, UpdateAdminUser)
router.patch('/admin/users/:id/status', requireLogin, requireAdmin, ToggleUserStatus)
router.put('/admin/clock/:id', requireLogin, requireAdmin, UpdateClockRecord)
router.delete('/admin/clock/:id', requireLogin, requireAdmin, DeleteClockRecord)
router.post('/admin/absence', requireLogin, requireAdmin, CreateAbsenceRecord)
router.delete('/admin/absence', requireLogin, requireAdmin, DeleteAbsenceRecord)

async function LoginUser(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email])
    const user = rows[0]

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const match = await verifyPassword(password, user.password)
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact your administrator.' })
    }

    req.session.userId = user.id
    req.session.role = user.role
    return res.json({ ok: true, name: user.name, role: user.role })
  } catch (error) {
    return res.status(500).json({ error: 'Login failed.', details: error.message })
  }
}

async function LogoutUser(req, res) {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: 'Logout failed.' })
    }

    return res.json({ ok: true })
  })
}

async function GetMe(req, res) {
  try {
    const [rows] = await pool.execute('SELECT name, role FROM users WHERE id = ?', [req.session.userId])
    return res.json(rows[0] || {})
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load profile.', details: error.message })
  }
}

async function ClockIn(req, res) {
  const date = todayString()
  const [existingRows] = await pool.execute(
    'SELECT * FROM clock_records WHERE user_id = ? AND date = ?',
    [req.session.userId, date]
  )
  const existing = existingRows[0]

  if (existing && existing.clock_in) {
    return res.json({ error: 'Already clocked in today.' })
  }

  const now = new Date()
  const isLate = now.getHours() >= 9 ? 1 : 0

  if (existing) {
    await pool.execute(
      'UPDATE clock_records SET clock_in = ?, is_late = ? WHERE id = ?',
      [now, isLate, existing.id]
    )
  } else {
    await pool.execute(
      'INSERT INTO clock_records (user_id, date, clock_in, is_late) VALUES (?, ?, ?, ?)',
      [req.session.userId, date, now, isLate]
    )
  }

  return res.json({ ok: true })
}

async function ClockOut(req, res) {
  const date = todayString()
  const [rows] = await pool.execute(
    'SELECT * FROM clock_records WHERE user_id = ? AND date = ?',
    [req.session.userId, date]
  )
  const record = rows[0]

  if (!record || !record.clock_in) {
    return res.json({ error: 'You have not clocked in yet today.' })
  }

  await pool.execute('UPDATE clock_records SET clock_out = ? WHERE id = ?', [new Date(), record.id])
  return res.json({ ok: true })
}

async function GetTodayClock(req, res) {
  const [rows] = await pool.execute(
    'SELECT * FROM clock_records WHERE user_id = ? AND date = ?',
    [req.session.userId, todayString()]
  )

  return res.json(rows[0] || { clock_in: null, clock_out: null })
}

async function GetAdminToday(req, res) {
  const date = todayString()

  try {
    const [rows] = await pool.query(
      `
        SELECT u.id, u.name, u.department, u.active,
               c.id AS record_id, c.clock_in, c.clock_out, c.is_late, c.record_type
        FROM users u
        LEFT JOIN clock_records c ON c.user_id = u.id AND c.date = ?
        WHERE u.role = 'teacher'
      `,
      [date]
    )

    const result = rows.map((row) => ({
      id: row.id,
      name: row.name,
      department: row.department,
      active: !!row.active,
      status: row.clock_in && !row.clock_out ? 'In' : row.clock_out ? 'Out' : '—',
      clock_in: row.clock_in,
      clock_out: row.clock_out,
      is_late: !!row.is_late,
      record_type: row.record_type || 'attendance',
      record_id: row.record_id
    }))

    return res.json(result)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load today attendance.', details: error.message })
  }
}

async function ExportAttendanceCsv(req, res) {
  const date = todayString()

  try {
    const [rows] = await pool.query(
      `
        SELECT u.name, u.department, c.clock_in, c.clock_out, c.is_late, c.record_type
        FROM clock_records c
        JOIN users u ON u.id = c.user_id
        WHERE c.date = ?
      `,
      [date]
    )

    let csv = 'Name,Department,Clock In,Clock Out,Late,Type\n'
    rows.forEach((row) => {
      csv += `${row.name},${row.department},${row.clock_in || ''},${row.clock_out || ''},${row.is_late ? 'Yes' : 'No'},${row.record_type || 'attendance'}\n`
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${date}.csv`)
    return res.send(csv)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to export attendance.', details: error.message })
  }
}

async function GetAdminReport(req, res) {
  const { from, to } = req.query

  if (!from || !to) {
    return res.status(400).json({ error: 'from and to query parameters are required.' })
  }

  try {
    const [rows] = await pool.query(
      `
        SELECT u.name, u.department, c.date, c.clock_in, c.clock_out, c.is_late, c.record_type
        FROM clock_records c
        JOIN users u ON u.id = c.user_id
        WHERE c.date BETWEEN ? AND ?
        ORDER BY c.date DESC
      `,
      [from, to]
    )

    const result = rows.map((row) => ({ ...row, is_late: !!row.is_late }))
    return res.json(result)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load report.', details: error.message })
  }
}

async function GetNotices(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || req.query.perPage) || 10))
    const offset = (page - 1) * limit

    const [[countRows]] = await pool.query('SELECT COUNT(*) AS cnt FROM notices')
    const total = countRows.cnt || 0

    const [rows] = await pool.query(
      `SELECT n.*, u.name AS author
       FROM notices n
       JOIN users u ON n.created_by = u.id
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    return res.json({ items: rows.map((row) => ({ ...row, is_urgent: !!row.is_urgent })), total })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load notices.', details: error.message })
  }
}

async function CreateNotice(req, res) {
  const { title, body, is_urgent = false } = req.body

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' })
  }

  try {
    await pool.query(
      'INSERT INTO notices (title, body, is_urgent, created_by) VALUES (?, ?, ?, ?)',
      [title, body, is_urgent ? 1 : 0, req.session.userId]
    )
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Could not create notice.', details: error.message })
  }
}

async function UpdateNotice(req, res) {
  const { title, body, is_urgent } = req.body

  try {
    await pool.query(
      'UPDATE notices SET title = ?, body = ?, is_urgent = ? WHERE id = ?',
      [title, body, is_urgent ? 1 : 0, req.params.id]
    )
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Could not update notice.', details: error.message })
  }
}

async function DeleteNotice(req, res) {
  try {
    await pool.query('DELETE FROM notices WHERE id = ?', [req.params.id])
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Could not delete notice.', details: error.message })
  }
}

async function UpdateAdminUser(req, res) {
  const { name, email, department } = req.body
  const fields = []
  const values = []

  if (name !== undefined) {
    fields.push('name = ?')
    values.push(name)
  }

  if (email !== undefined) {
    fields.push('email = ?')
    values.push(email)
  }

  if (department !== undefined) {
    fields.push('department = ?')
    values.push(department)
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields provided.' })
  }

  values.push(req.params.id)

  try {
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)
    return res.json({ ok: true })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already in use by another account.' })
    }

    return res.status(500).json({ error: 'Could not update user.', details: error.message })
  }
}

async function ToggleUserStatus(req, res) {
  const { active } = req.body

  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'active must be true or false.' })
  }

  if (Number(req.params.id) === req.session.userId) {
    return res.status(400).json({ error: 'You cannot suspend your own account.' })
  }

  try {
    await pool.execute('UPDATE users SET active = ? WHERE id = ?', [active ? 1 : 0, req.params.id])
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Could not update user status.', details: error.message })
  }
}

async function UpdateClockRecord(req, res) {
  const { clock_in, clock_out } = req.body
  const fields = []
  const values = []

  if (clock_in !== undefined) {
    fields.push('clock_in = ?')
    values.push(new Date(clock_in))
  }

  if (clock_out !== undefined) {
    fields.push('clock_out = ?')
    values.push(new Date(clock_out))
  }

  if (fields.length === 0) {
    return res.json({ error: 'Nothing to update.' })
  }

  values.push(req.params.id)
  await pool.query(`UPDATE clock_records SET ${fields.join(', ')} WHERE id = ?`, values)
  res.json({ ok: true })
}

async function DeleteClockRecord(req, res) {
  try {
    await pool.query('DELETE FROM clock_records WHERE id = ?', [req.params.id])
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Could not delete clock record.', details: error.message })
  }
}

async function CreateAbsenceRecord(req, res) {
  const { user_id, date, record_type } = req.body
  const allowed = ['absent', 'sick_leave', 'personal_leave']

  if (!allowed.includes(record_type)) {
    return res.status(400).json({ error: 'Invalid record_type.' })
  }

  try {
    await pool.query('DELETE FROM clock_records WHERE user_id = ? AND date = ?', [user_id, date])
    await pool.query('INSERT INTO clock_records (user_id, date, record_type) VALUES (?, ?, ?)', [user_id, date, record_type])
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Could not create absence record.', details: error.message })
  }
}

async function DeleteAbsenceRecord(req, res) {
  const { user_id, date } = req.body

  try {
    await pool.query('DELETE FROM clock_records WHERE user_id = ? AND date = ? AND clock_in IS NULL', [user_id, date])
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Could not remove absence record.', details: error.message })
  }
}

async function CreateUser(req, res) {
  const userDetails = req.body
  if (!userDetails || Object.keys(userDetails).length === 0) {
    return res.status(400).json({ error: 'User details are required.' })
  }

  const { password, email } = userDetails
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  try {
    const hashedPassword = await HashPassword(password)
    const user = await UsersModel.create({ ...userDetails, password: hashedPassword })

    return res.status(201).json({ message: 'User created successfully', userId: user._id })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists.' })
    }

    return res.status(500).json({ error: 'Failed to create user.', details: err.message })
  }
}

async function UpdateUserByID(req, res) {
  const userId = req.params.id
  const updates = req.body

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No update data provided.' })
  }

  try {
    const user = await UsersModel.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User does not exist.' })
    }

    if (updates.password) {
      updates.password = await HashPassword(updates.password)
    }

    const updatedUser = { ...user, ...updates }
    delete updatedUser.id
    await UsersModel.save({ ...updatedUser, id: userId })
    return res.status(200).json({ message: 'User updated successfully.' })
  } catch (err) {
    return res.status(500).json({ message: 'Update failed.', error: err.message })
  }
}

async function DeleteUserById(req, res) {
  try {
    const userId = req.params.id
    const deletedUser = await UsersModel.findByIdAndDelete(userId)

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' })
    }

    return res.status(200).json({ message: 'User deleted successfully.' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user.', details: err.message })
  }
}

async function DeleteAllUsers(req, res) {
  try {
    await UsersModel.deleteMany()
    return res.status(200).json({ message: 'All users deleted successfully.' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete users.', details: err.message })
  }
}

export { CreateUser, UpdateUserByID, DeleteUserById, DeleteAllUsers }
export default router
