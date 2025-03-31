import { 
  User, InsertUser, 
  Entry, InsertEntry, 
  Tag, InsertTag, 
  EntryTag, InsertEntryTag,
  EntryWithTags
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStreak(userId: number): Promise<User>;
  getUserStreak(userId: number): Promise<{ currentStreak: number, longestStreak: number, streakDates: Date[] }>;
  
  // Entry operations
  getEntryById(id: number): Promise<EntryWithTags | undefined>;
  getEntriesByUserId(userId: number): Promise<EntryWithTags[]>;
  createEntry(entry: InsertEntry): Promise<Entry>;
  updateEntry(id: number, entry: InsertEntry): Promise<Entry>;
  deleteEntry(id: number): Promise<void>;
  
  // Tag operations
  getAllTags(): Promise<Tag[]>;
  getTagById(id: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  
  // Entry-Tag operations
  addTagToEntry(entryId: number, tagId: number): Promise<EntryTag>;
  removeTagFromEntry(entryId: number, tagId: number): Promise<void>;
  
  // Calendar operations
  getCalendarData(userId: number, year: number, month: number): Promise<{ date: string, entryId?: number }[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private entries: Map<number, Entry>;
  private tags: Map<number, Tag>;
  private entryTags: Map<number, EntryTag>;
  private userId: number;
  private entryId: number;
  private tagId: number;
  private entryTagId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.entries = new Map();
    this.tags = new Map();
    this.entryTags = new Map();
    this.userId = 1;
    this.entryId = 1;
    this.tagId = 1;
    this.entryTagId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Create some default tags
    const defaultTags = ["Personal", "Work", "Family", "Health", "Gratitude", "Productivity"];
    defaultTags.forEach(tagName => {
      this.createTag({ name: tagName });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      currentStreak: 0,
      longestStreak: 0,
      lastEntryDate: null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStreak(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (user.lastEntryDate) {
      // Create date objects for comparison (without time)
      const lastEntryDay = new Date(
        user.lastEntryDate.getFullYear(),
        user.lastEntryDate.getMonth(),
        user.lastEntryDate.getDate()
      );
      
      // If already logged today, no streak update
      if (today.getTime() === lastEntryDay.getTime()) {
        return user;
      }
      
      // Calculate the difference in days
      const diffTime = today.getTime() - lastEntryDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // If logged yesterday, increment streak
      if (diffDays === 1) {
        user.currentStreak += 1;
        user.longestStreak = Math.max(user.currentStreak, user.longestStreak);
      } 
      // If more than 1 day gap, reset streak
      else if (diffDays > 1) {
        user.currentStreak = 1;
      }
    } else {
      // First entry
      user.currentStreak = 1;
      user.longestStreak = 1;
    }

    // Update last entry date
    user.lastEntryDate = now;
    this.users.set(userId, user);
    return user;
  }

  async getUserStreak(userId: number): Promise<{ currentStreak: number, longestStreak: number, streakDates: Date[] }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get all entries for the user
    const entries = await this.getEntriesByUserId(userId);
    
    // Extract and sort all entry dates
    const entryDates = entries.map(entry => new Date(entry.createdAt)).sort((a, b) => a.getTime() - b.getTime());
    
    // Get dates for the past 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pastSevenDays = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      pastSevenDays.push(date);
    }
    
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      streakDates: pastSevenDays
    };
  }

  // Entry operations
  async getEntryById(id: number): Promise<EntryWithTags | undefined> {
    const entry = this.entries.get(id);
    if (!entry) return undefined;

    // Get tags for this entry
    const entryTagsList = Array.from(this.entryTags.values()).filter(
      (entryTag) => entryTag.entryId === id
    );
    
    const tags = entryTagsList.map((entryTag) => {
      const tag = this.tags.get(entryTag.tagId);
      return tag!;
    });

    return { ...entry, tags };
  }

  async getEntriesByUserId(userId: number): Promise<EntryWithTags[]> {
    const userEntries = Array.from(this.entries.values()).filter(
      (entry) => entry.userId === userId
    );
    
    // Sort by date descending (newest first)
    userEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Add tags to each entry
    const entriesWithTags = userEntries.map((entry) => {
      const entryTagsList = Array.from(this.entryTags.values()).filter(
        (entryTag) => entryTag.entryId === entry.id
      );
      
      const tags = entryTagsList.map((entryTag) => {
        const tag = this.tags.get(entryTag.tagId);
        return tag!;
      });
      
      return { ...entry, tags };
    });
    
    return entriesWithTags;
  }

  async createEntry(insertEntry: InsertEntry): Promise<Entry> {
    const id = this.entryId++;
    const now = new Date();
    const entry: Entry = { 
      ...insertEntry, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.entries.set(id, entry);
    return entry;
  }

  async updateEntry(id: number, updatedEntry: InsertEntry): Promise<Entry> {
    const existingEntry = this.entries.get(id);
    if (!existingEntry) {
      throw new Error("Entry not found");
    }
    
    const now = new Date();
    const entry: Entry = { 
      ...existingEntry, 
      ...updatedEntry, 
      id, 
      updatedAt: now 
    };
    this.entries.set(id, entry);
    return entry;
  }

  async deleteEntry(id: number): Promise<void> {
    // Also delete related entry-tag relations
    const entryTagsToDelete = Array.from(this.entryTags.values()).filter(
      (entryTag) => entryTag.entryId === id
    );
    
    for (const entryTag of entryTagsToDelete) {
      this.entryTags.delete(entryTag.id);
    }
    
    this.entries.delete(id);
  }

  // Tag operations
  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTagById(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    // Check if tag already exists
    const existingTag = Array.from(this.tags.values()).find(
      (tag) => tag.name.toLowerCase() === insertTag.name.toLowerCase()
    );
    
    if (existingTag) {
      return existingTag;
    }
    
    const id = this.tagId++;
    const tag: Tag = { ...insertTag, id };
    this.tags.set(id, tag);
    return tag;
  }

  // Entry-Tag operations
  async addTagToEntry(entryId: number, tagId: number): Promise<EntryTag> {
    // Check if entry and tag exist
    const entry = this.entries.get(entryId);
    const tag = this.tags.get(tagId);
    
    if (!entry || !tag) {
      throw new Error("Entry or tag not found");
    }
    
    // Check if relation already exists
    const existingRelation = Array.from(this.entryTags.values()).find(
      (entryTag) => entryTag.entryId === entryId && entryTag.tagId === tagId
    );
    
    if (existingRelation) {
      return existingRelation;
    }
    
    const id = this.entryTagId++;
    const entryTag: EntryTag = { id, entryId, tagId };
    this.entryTags.set(id, entryTag);
    return entryTag;
  }

  async removeTagFromEntry(entryId: number, tagId: number): Promise<void> {
    const entryTag = Array.from(this.entryTags.values()).find(
      (entryTag) => entryTag.entryId === entryId && entryTag.tagId === tagId
    );
    
    if (entryTag) {
      this.entryTags.delete(entryTag.id);
    }
  }

  // Calendar operations
  async getCalendarData(userId: number, year: number, month: number): Promise<{ date: string, entryId?: number }[]> {
    // Get all entries for the user
    const entries = await this.getEntriesByUserId(userId);
    
    // Filter entries for the specified month and year
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month - 1;
    });
    
    // Create a map of dates to entry IDs
    const dateToEntryMap = new Map<string, number>();
    
    filteredEntries.forEach(entry => {
      const entryDate = new Date(entry.createdAt);
      const dateString = entryDate.toISOString().split('T')[0];
      dateToEntryMap.set(dateString, entry.id);
    });
    
    // Get all days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const dateString = dateObj.toISOString().split('T')[0];
      
      if (dateToEntryMap.has(dateString)) {
        calendarData.push({
          date: dateString,
          entryId: dateToEntryMap.get(dateString)
        });
      } else {
        calendarData.push({
          date: dateString
        });
      }
    }
    
    return calendarData;
  }
}

export const storage = new MemStorage();
