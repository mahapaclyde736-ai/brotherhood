import { pool } from '../db/connection.js'

const UserModel = {
  async create(userData) {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, department, active) VALUES (?, ?, ?, ?, ?, ?)',
      [userData.name, userData.email, userData.password, userData.role || 'staff', userData.department || '', userData.active ?? 1]
    )
    return { _id: result.insertId, ...userData }
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id])
    return rows[0] || null
  },

  async findByIdAndDelete(id) {
    const user = await this.findById(id)
    if (!user) return null
    await pool.execute('DELETE FROM users WHERE id = ?', [id])
    return user
  },

  async deleteMany() {
    await pool.execute('DELETE FROM users')
  },

  async save(user) {
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, password = ?, role = ?, department = ?, active = ? WHERE id = ?',
      [user.name, user.email, user.password, user.role, user.department, user.active, user.id]
    )
  }
}

export default UserModel
