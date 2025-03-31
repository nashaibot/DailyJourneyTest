import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertEntrySchema, insertTagSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Journal Entries Routes
  app.get("/api/entries", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const entries = await storage.getEntriesByUserId(req.user.id);
      res.json(entries);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/entries/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).send("Invalid entry ID");
      }
      
      const entry = await storage.getEntryById(entryId);
      
      if (!entry) {
        return res.status(404).send("Entry not found");
      }
      
      if (entry.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      res.json(entry);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/entries", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const validatedData = insertEntrySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const entry = await storage.createEntry(validatedData);
      
      // Update user streak
      await storage.updateUserStreak(req.user.id);
      
      res.status(201).json(entry);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/entries/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).send("Invalid entry ID");
      }
      
      const existingEntry = await storage.getEntryById(entryId);
      
      if (!existingEntry) {
        return res.status(404).send("Entry not found");
      }
      
      if (existingEntry.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const validatedData = insertEntrySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const updatedEntry = await storage.updateEntry(entryId, validatedData);
      res.json(updatedEntry);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/entries/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).send("Invalid entry ID");
      }
      
      const existingEntry = await storage.getEntryById(entryId);
      
      if (!existingEntry) {
        return res.status(404).send("Entry not found");
      }
      
      if (existingEntry.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      await storage.deleteEntry(entryId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Tags Routes
  app.get("/api/tags", async (req, res, next) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tags", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      next(error);
    }
  });

  // Entry Tags Routes
  app.post("/api/entries/:entryId/tags", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const entryId = parseInt(req.params.entryId);
      if (isNaN(entryId)) {
        return res.status(400).send("Invalid entry ID");
      }
      
      const entry = await storage.getEntryById(entryId);
      if (!entry) {
        return res.status(404).send("Entry not found");
      }
      
      if (entry.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      const tagSchema = z.object({
        tagId: z.number()
      });
      
      const { tagId } = tagSchema.parse(req.body);
      
      const entryTag = await storage.addTagToEntry(entryId, tagId);
      res.status(201).json(entryTag);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/entries/:entryId/tags/:tagId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const entryId = parseInt(req.params.entryId);
      const tagId = parseInt(req.params.tagId);
      
      if (isNaN(entryId) || isNaN(tagId)) {
        return res.status(400).send("Invalid entry or tag ID");
      }
      
      const entry = await storage.getEntryById(entryId);
      if (!entry) {
        return res.status(404).send("Entry not found");
      }
      
      if (entry.userId !== req.user.id) {
        return res.status(403).send("Forbidden");
      }
      
      await storage.removeTagFromEntry(entryId, tagId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Calendar/Stats Routes
  app.get("/api/calendar/:year/:month", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).send("Invalid year or month");
      }
      
      const calendarData = await storage.getCalendarData(req.user.id, year, month);
      res.json(calendarData);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/streak", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const streakData = await storage.getUserStreak(req.user.id);
      res.json(streakData);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
