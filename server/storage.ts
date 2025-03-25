import { birthdays, type Birthday, type InsertBirthday, toBirthday } from "@shared/schema";

export interface IStorage {
  getAllBirthdays(): Promise<Birthday[]>;
  createBirthday(birthday: InsertBirthday): Promise<Birthday>;
  searchBirthdays(query: string): Promise<Birthday[]>;
  updateBirthday(id: number, birthday: InsertBirthday): Promise<Birthday | null>;
  getBirthdayById(id: number): Promise<Birthday | null>;
}

export class MemStorage implements IStorage {
  private birthdays: Map<number, Birthday>;
  currentId: number;

  constructor() {
    this.birthdays = new Map();
    this.currentId = 1;
    
    // Preload with some sample data for development
    const sampleBirthdays: InsertBirthday[] = [
      { name: "Marie Dubois", birthdate: "2023-05-15", message: "N'oubliez pas de lui souhaiter son anniversaire!" },
      { name: "Thomas Martin", birthdate: "2023-05-27", message: "Aime les gâteaux au chocolat" },
      { name: "Sophie Bernard", birthdate: "2023-06-13", message: "" },
      { name: "Jean Petit", birthdate: "2023-05-17", message: "Fête ses 40 ans cette année!" },
      { name: "Pierre Durand", birthdate: "2023-06-26", message: "Apprécie les cartes personnalisées" },
    ];
    
    sampleBirthdays.forEach(birthday => {
      this.createBirthday(birthday);
    });
  }

  async getAllBirthdays(): Promise<Birthday[]> {
    return Array.from(this.birthdays.values());
  }

  async createBirthday(insertBirthday: InsertBirthday): Promise<Birthday> {
    const id = this.currentId++;
    const birthday = toBirthday(insertBirthday, id);
    this.birthdays.set(id, birthday);
    return birthday;
  }
  
  async searchBirthdays(query: string): Promise<Birthday[]> {
    if (!query) {
      return this.getAllBirthdays();
    }
    
    const lowerQuery = query.toLowerCase();
    return Array.from(this.birthdays.values()).filter(
      birthday => birthday.name.toLowerCase().includes(lowerQuery)
    );
  }
  
  async getBirthdayById(id: number): Promise<Birthday | null> {
    const birthday = this.birthdays.get(id);
    return birthday || null;
  }
  
  async updateBirthday(id: number, birthday: InsertBirthday): Promise<Birthday | null> {
    if (!this.birthdays.has(id)) {
      return null;
    }
    
    const updatedBirthday = toBirthday(birthday, id);
    this.birthdays.set(id, updatedBirthday);
    return updatedBirthday;
  }
}

export const storage = new MemStorage();
