import { birthdays, type Birthday, type InsertBirthday, toBirthday } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

export interface IStorage {
  getAllBirthdays(): Promise<Birthday[]>;
  createBirthday(birthday: InsertBirthday): Promise<Birthday>;
  searchBirthdays(query: string): Promise<Birthday[]>;
  updateBirthday(id: number, birthday: InsertBirthday): Promise<Birthday | null>;
  getBirthdayById(id: number): Promise<Birthday | null>;
  deleteBirthday(id: number): Promise<boolean>;
}

// Classe de stockage en mémoire (conservée pour référence)
export class MemStorage implements IStorage {
  private birthdays: Map<number, Birthday>;
  currentId: number;

  constructor() {
    this.birthdays = new Map();
    this.currentId = 1;
    
    // Précharger avec des exemples de données pour le développement
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
  
  async deleteBirthday(id: number): Promise<boolean> {
    if (!this.birthdays.has(id)) {
      return false;
    }
    
    return this.birthdays.delete(id);
  }
}

// Interface pour les données stockées dans le fichier
interface StoredData {
  birthdays: Birthday[];
  currentId: number;
}

// Nouvelle classe de stockage utilisant un fichier JSON
export class FileStorage implements IStorage {
  private filePath: string;
  private data: StoredData;

  constructor(filePath: string) {
    this.filePath = filePath;
    
    // Créer le dossier data s'il n'existe pas
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Initialiser ou charger les données
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        this.data = JSON.parse(fileContent);
        console.log(`Données chargées depuis ${filePath}`);
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error);
        this.initializeDefaultData();
      }
    } else {
      console.log(`Fichier ${filePath} non trouvé, initialisation des données par défaut`);
      this.initializeDefaultData();
    }
  }

  private initializeDefaultData() {
    // Initialiser avec des données par défaut
    this.data = {
      birthdays: [],
      currentId: 1
    };

    // Ajouter quelques anniversaires initiaux pour les tests
    const sampleBirthdays: InsertBirthday[] = [
      { name: "Marie Dubois", birthdate: "2023-05-15", message: "N'oubliez pas de lui souhaiter son anniversaire!" },
      { name: "Thomas Martin", birthdate: "2023-05-27", message: "Aime les gâteaux au chocolat" },
      { name: "Sophie Bernard", birthdate: "2023-06-13", message: "" },
      { name: "Jean Petit", birthdate: "2023-05-17", message: "Fête ses 40 ans cette année!" },
      { name: "Pierre Durand", birthdate: "2023-06-26", message: "Apprécie les cartes personnalisées" },
    ];
    
    sampleBirthdays.forEach(birthday => {
      const id = this.data.currentId++;
      const newBirthday = toBirthday(birthday, id);
      this.data.birthdays.push(newBirthday);
    });
    
    // Sauvegarder dans le fichier
    this.saveToFile();
  }

  private saveToFile(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
      console.log(`Données sauvegardées dans ${this.filePath}`);
    } catch (error) {
      console.error('Erreur lors de l\'écriture dans le fichier:', error);
    }
  }

  async getAllBirthdays(): Promise<Birthday[]> {
    return this.data.birthdays;
  }

  async createBirthday(insertBirthday: InsertBirthday): Promise<Birthday> {
    const id = this.data.currentId++;
    const birthday = toBirthday(insertBirthday, id);
    this.data.birthdays.push(birthday);
    this.saveToFile();
    return birthday;
  }

  async searchBirthdays(query: string): Promise<Birthday[]> {
    if (!query) {
      return this.getAllBirthdays();
    }
    
    const lowerQuery = query.toLowerCase();
    return this.data.birthdays.filter(
      birthday => birthday.name.toLowerCase().includes(lowerQuery)
    );
  }

  async getBirthdayById(id: number): Promise<Birthday | null> {
    const birthday = this.data.birthdays.find(b => b.id === id);
    return birthday || null;
  }

  async updateBirthday(id: number, birthday: InsertBirthday): Promise<Birthday | null> {
    const index = this.data.birthdays.findIndex(b => b.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedBirthday = toBirthday(birthday, id);
    this.data.birthdays[index] = updatedBirthday;
    this.saveToFile();
    return updatedBirthday;
  }

  async deleteBirthday(id: number): Promise<boolean> {
    const initialLength = this.data.birthdays.length;
    this.data.birthdays = this.data.birthdays.filter(b => b.id !== id);
    
    const deleted = initialLength > this.data.birthdays.length;
    if (deleted) {
      this.saveToFile();
    }
    
    return deleted;
  }
}

// Utiliser le stockage avec fichier au lieu du stockage en mémoire
export const storage = new FileStorage('./data/birthdays.json');
