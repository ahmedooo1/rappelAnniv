import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBirthdaySchema, insertGroupSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { authenticateAdmin, authenticateGroup } from "./middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Route to get all birthdays
  // Route de connexion
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await storage.validateUser(email, password);
    if (!user) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    // Générer un token simple pour l'exemple
    const token = Buffer.from(`${user.id}-${Date.now()}`).toString('base64');
    return res.json({ ...user, token });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la connexion" });
  }
});

// Route d'inscription
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }
    const user = await storage.createUser(email, password, role);
    return res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'inscription" });
  }
});

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

  // Route to delete a birthday
  app.delete("/api/birthdays/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID invalide" });
      }

      const success = await storage.deleteBirthday(id);
      if (!success) {
        return res.status(404).json({ message: "Anniversaire non trouvé" });
      }

      res.status(200).json({ message: "Anniversaire supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'anniversaire" });
    }
  });

  const httpServer = createServer(app);
  // Routes pour les groupes
  app.post("/api/groups", authenticateAdmin, async (req, res) => {
    try {
      const groupResult = insertGroupSchema.safeParse(req.body);
      if (!groupResult.success) {
        return res.status(400).json({ message: "Données invalides" });
      }
      const group = await storage.createGroup(groupResult.data);
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création du groupe" });
    }
  });

  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des groupes" });
    }
  });

  app.post("/api/groups/:id/auth", async (req, res) => {
    try {
      const { identifier, password } = req.body;
      const group = await storage.validateGroupAccess(parseInt(req.params.id), identifier, password);
      if (!group) {
        return res.status(401).json({ message: "Identifiant ou mot de passe incorrect" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de l'authentification" });
    }
  });

  return httpServer;
}
