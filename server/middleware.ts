
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }
  
  try {
    const user = await storage.validateAdminToken(token);
    if (!user) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Erreur d'authentification" });
  }
}

export async function authenticateGroup(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }
  
  try {
    const group = await storage.validateGroupToken(token);
    if (!group) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }
    req.group = group;
    next();
  } catch (error) {
    res.status(500).json({ message: "Erreur d'authentification" });
  }
}
