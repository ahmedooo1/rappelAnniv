
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

    await conn.query(`
      ALTER TABLE groups ADD FOREIGN KEY (leader_id) REFERENCES users(id)
    `);
    
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    conn.release();
  }
}

// Initialize database on startup
initDatabase();

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class Storage {
  async createUser(email: string, password: string, role: string, groupId?: number): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, role, groupId) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, role, groupId]
    );
    return { id: result.insertId, email, role, groupId } as User;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, user.password)) {
      return null;
    }
    return user as User;
  }

  async createGroup(name: string, description?: string): Promise<Group> {
    const [result] = await pool.execute(
      'INSERT INTO groups (name, description) VALUES (?, ?)',
      [name, description]
    );
    return { id: result.insertId, name, description } as Group;
  }

  async getBirthdaysByGroup(groupId: number): Promise<Birthday[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM birthdays WHERE groupId = ?',
      [groupId]
    );
    return rows as Birthday[];
  }

  async createBirthday(data: Omit<Birthday, 'id'>): Promise<Birthday> {
    const [result] = await pool.execute(
      'INSERT INTO birthdays (name, birthdate, groupId) VALUES (?, ?, ?)',
      [data.name, data.birthdate, data.groupId]
    );
    return { id: result.insertId, ...data } as Birthday;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
}

async getUsersByGroup(groupId: number): Promise<User[]> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE groupId = ?', [groupId]);
    return rows as User[];
}

async addUserToGroup(userId: number, groupId: number): Promise<void> {
    await pool.execute('UPDATE users SET groupId = ? WHERE id = ?', [groupId, userId]);
}

async removeUserFromGroup(userId: number): Promise<void> {
    await pool.execute('UPDATE users SET groupId = NULL WHERE id = ?', [userId]);
}

async createAdmin(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, "ADMIN")',
        [email, hashedPassword]
    );
    return { id: result.insertId, email, role: 'ADMIN' } as User;
}

async checkUpcomingBirthdays() {
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
}

export const storage = new Storage();
