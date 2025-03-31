import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastEntryDate: timestamp("last_entry_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Journal entries table
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mood: text("mood"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Entry-tag relationship (many-to-many)
export const entryTags = pgTable("entry_tags", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull().references(() => entries.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  email: true,
});

export const insertEntrySchema = createInsertSchema(entries).pick({
  userId: true,
  title: true,
  content: true,
  mood: true,
  isPublished: true,
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
});

export const insertEntryTagSchema = createInsertSchema(entryTags).pick({
  entryId: true,
  tagId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Entry = typeof entries.$inferSelect;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertEntryTag = z.infer<typeof insertEntryTagSchema>;
export type EntryTag = typeof entryTags.$inferSelect;

// Extended entry type with tags
export type EntryWithTags = Entry & { tags: Tag[] };
