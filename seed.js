// seed.js — run ONCE with: node seed.js
import bcrypt from 'bcryptjs';
import db from './database.js';

const users = [
  { name: 'Admin User',    email: 'admin@school.ac.zw',   password: 'admin123',   role: 'admin',   department: 'Administration' },
  { name: 'Grace Moyo',    email: 'g.moyo@school.ac.zw',  password: 'teacher123', role: 'teacher', department: 'Mathematics' },
  { name: 'Tinashe Dube',  email: 't.dube@school.ac.zw',  password: 'teacher123', role: 'teacher', department: 'Science' },
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)'
);

for (const u of users) {
  const hash = bcrypt.hashSync(u.password, 10);
  insert.run(u.name, u.email, hash, u.role, u.department);
  console.log(`Created: ${u.email}`);
}
console.log('Seeding complete.');


