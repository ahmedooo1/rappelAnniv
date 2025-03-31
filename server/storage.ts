
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

  async checkUpcomingBirthdays() {
    const [birthdays] = await pool.execute(`
      SELECT b.*, g.*, u.email 
      FROM birthdays b 
      JOIN groups g ON b.groupId = g.id 
      JOIN users u ON u.groupId = g.id 
      WHERE DATE(b.birthdate) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
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
