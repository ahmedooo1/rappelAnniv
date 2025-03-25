import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBirthdaySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Route to get all birthdays
  app.get("/api/birthdays", async (req, res) => {
    try {
      const birthdays = await storage.getAllBirthdays();
      res.json(birthdays);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des anniversaires" });
    }
  });

  // Route to search birthdays
  app.get("/api/birthdays/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const birthdays = await storage.searchBirthdays(query);
      res.json(birthdays);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la recherche des anniversaires" });
    }
  });

  // Route to add a new birthday
  app.post("/api/birthdays", async (req, res) => {
    try {
      const birthdayResult = insertBirthdaySchema.safeParse(req.body);
      
      if (!birthdayResult.success) {
        const errorMessage = fromZodError(birthdayResult.error).message;
        return res.status(400).json({ message: `Validation échouée: ${errorMessage}` });
      }

      const newBirthday = await storage.createBirthday(birthdayResult.data);
      res.status(201).json(newBirthday);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'ajout de l'anniversaire" });
    }
  });

  // Route to get a birthday by ID
  app.get("/api/birthdays/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalide" });
      }

      const birthday = await storage.getBirthdayById(id);
      if (!birthday) {
        return res.status(404).json({ message: "Anniversaire non trouvé" });
      }

      res.json(birthday);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de l'anniversaire" });
    }
  });

  // Route to update a birthday
  app.put("/api/birthdays/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalide" });
      }

      const birthdayResult = insertBirthdaySchema.safeParse(req.body);
      
      if (!birthdayResult.success) {
        const errorMessage = fromZodError(birthdayResult.error).message;
        return res.status(400).json({ message: `Validation échouée: ${errorMessage}` });
      }

      const updatedBirthday = await storage.updateBirthday(id, birthdayResult.data);
      if (!updatedBirthday) {
        return res.status(404).json({ message: "Anniversaire non trouvé" });
      }

      res.json(updatedBirthday);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'anniversaire" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
