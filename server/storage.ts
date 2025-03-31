import * as mysql from 'mysql2/promise';
import { Birthday, Group, User } from '@shared/schema';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'birthday_app',
  waitForConnections: true,
  connectionLimit: 10,
});

// Initialisation des tables
async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    // Create database if not exists
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || 'birthday_app'}`);
    await conn.query(`USE ${process.env.MYSQL_DATABASE || 'birthday_app'}`);

    // Create tables
    await conn.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        leader_id INT
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'GROUP_LEADER', 'MEMBER') NOT NULL,
        groupId INT,
        FOREIGN KEY (groupId) REFERENCES groups(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS birthdays (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        birthdate DATE NOT NULL,
        groupId INT NOT NULL,
        notified BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (groupId) REFERENCES groups(id)
      )
    `);
  } finally {
    conn.release();
  }
}

// User functions
async function createUser(email: string, password: string, role: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
    [email, hashedPassword, role]
  );
  return { id: result.insertId, email, role, password: hashedPassword };
}

async function validateUser(email: string, password: string): Promise<User | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0) return null;

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  return valid ? user : null;
}

async function getUserByEmail(email: string): Promise<User | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows.length > 0 ? rows[0] : null;
}

// Group functions
async function createGroup(name: string, description: string, leaderId: number): Promise<Group> {
  const [result] = await pool.query(
    'INSERT INTO groups (name, description, leader_id) VALUES (?, ?, ?)',
    [name, description, leaderId]
  );
  return { id: result.insertId, name, description };
}

// Birthday functions
export async function getAllBirthdays(): Promise<Birthday[]> {
  const [rows] = await pool.query('SELECT * FROM birthdays');
  return rows;
}

export async function getBirthdayById(id: number): Promise<Birthday | null> {
  const [rows] = await pool.query('SELECT * FROM birthdays WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function createBirthday(birthday: Omit<Birthday, 'id'>): Promise<Birthday> {
  try {
    const [result] = await pool.query(
      'INSERT INTO birthdays (name, birthdate, groupId) VALUES (?, ?, ?)',
      [birthday.name, birthday.birthdate, birthday.groupId || 1]
    );
    return { id: result.insertId, ...birthday };
  } catch (error) {
    console.error('Erreur lors de la création:', error);
    throw error;
  }
}

export async function updateBirthday(id: number, birthday: Omit<Birthday, 'id'>): Promise<Birthday | null> {
  const [result] = await pool.query(
    'UPDATE birthdays SET name = ?, birthdate = ?, groupId = ? WHERE id = ?',
    [birthday.name, birthday.birthdate, birthday.groupId, id]
  );
  return result.affectedRows > 0 ? { id, ...birthday } : null;
}

export async function deleteBirthday(id: number): Promise<boolean> {
  const [result] = await pool.query('DELETE FROM birthdays WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function searchBirthdays(query: string): Promise<Birthday[]> {
  const [rows] = await pool.query('SELECT * FROM birthdays WHERE name LIKE ?', [`%${query}%`]);
  return rows;
}


// Initialize database on startup
initDatabase().catch(console.error);

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const storage = {
  createUser,
  validateUser,
  getUserByEmail,
  createGroup,
  getAllBirthdays,
  getBirthdayById,
  createBirthday,
  updateBirthday,
  deleteBirthday,
  searchBirthdays,
  checkUpcomingBirthdays: async function() {
    const [birthdays] = await pool.execute(`
      SELECT b.*, g.name as group_name, u.email 
      FROM birthdays b 
      JOIN groups g ON b.groupId = g.id 
      JOIN users u ON u.groupId = g.id 
      WHERE DATE_FORMAT(b.birthdate, '%m-%d') BETWEEN 
        DATE_FORMAT(CURDATE(), '%m-%d') AND 
        DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 7 DAY), '%m-%d')
      AND b.notified = FALSE
    `);

    for (const birthday of birthdays) {
      await mailer.sendMail({
        to: birthday.email,
        subject: `Anniversaire à venir: ${birthday.name}`,
        text: `N'oubliez pas l'anniversaire de ${birthday.name} le ${birthday.birthdate}!`,
      });
    }
  }
};