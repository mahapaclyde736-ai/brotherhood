/* global process */
import mysql from 'mysql2/promise'

// Create a reusable MySQL pool for the app's database connections.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clockinclockout',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: false
})

// Verify that the database is reachable and initialize the required tables.
async function verifyConnection() {
  const connection = await pool.getConnection()
  try {
    await connection.query('SELECT 1')
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'clockinclockout'}\`
    `)
    await connection.changeUser({ database: process.env.DB_NAME || 'clockinclockout' })
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'staff',
        department VARCHAR(255) DEFAULT '',
        active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        is_urgent TINYINT(1) DEFAULT 0,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clock_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        clock_in DATETIME NULL,
        clock_out DATETIME NULL,
        is_late TINYINT(1) DEFAULT 0,
        record_type VARCHAR(50) DEFAULT 'attendance',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY user_date (user_id, date)
      )
    `)
    console.log('MySQL connected and initialized')
    return pool
  } finally {
    connection.release()
  }
}

async function Connection() {
  try {
    return await verifyConnection()
  } catch (error) {
    console.error('Database connection failed:', error)
    throw error
  }
}

export { pool, verifyConnection }
export default Connection
