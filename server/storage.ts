import { PrismaClient } from '@prisma/client';
import { Birthday, Group, User } from '@shared/schema';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();

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
    return prisma.user.create({
      data: { email, password: hashedPassword, role, groupId },
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return null;
    }
    return user;
  }

  async createGroup(name: string, description?: string): Promise<Group> {
    return prisma.group.create({
      data: { name, description },
    });
  }

  async getBirthdaysByGroup(groupId: number): Promise<Birthday[]> {
    return prisma.birthday.findMany({
      where: { groupId },
    });
  }

  async createBirthday(data: Omit<Birthday, 'id'>): Promise<Birthday> {
    return prisma.birthday.create({
      data,
    });
  }

  async checkUpcomingBirthdays() {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingBirthdays = await prisma.birthday.findMany({
      where: {
        birthdate: {
          gte: today.toISOString(),
          lte: nextWeek.toISOString(),
        },
      },
      include: {
        group: {
          include: {
            users: true,
          },
        },
      },
    });

    for (const birthday of upcomingBirthdays) {
      const users = birthday.group.users;
      for (const user of users) {
        await mailer.sendMail({
          to: user.email,
          subject: `Anniversaire à venir: ${birthday.name}`,
          text: `N'oubliez pas l'anniversaire de ${birthday.name} le ${birthday.birthdate}!`,
        });
      }
    }
  }
}

export const storage = new Storage();