// Simple storage utility for token management
// Web: dùng localStorage
// iOS/Android: dùng AsyncStorage để persist data

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const TOKEN_KEY = "@auth_token";
const USER_KEY = "@auth_user";

// Helper to check if we're on web
const isWeb = Platform.OS === "web";

// In-memory fallback for native (only used if AsyncStorage fails)
let tokenStorage: string | null = null;
let userStorage: string | null = null;
let examProgressStorage: Map<string, string> = new Map();

export const storage = {
  // Token management
  async setToken(token: string): Promise<void> {
    if (isWeb && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(TOKEN_KEY, token);
      tokenStorage = token;
      return;
    }
    // iOS/Android: use AsyncStorage
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      tokenStorage = token;
    } catch (error) {
      console.error("Error saving token to AsyncStorage:", error);
      // Fallback to in-memory
      tokenStorage = token;
    }
  },

  async getToken(): Promise<string | null> {
    if (isWeb && typeof window !== "undefined" && window.localStorage) {
      const v = window.localStorage.getItem(TOKEN_KEY);
      tokenStorage = v;
      return v;
    }
    // iOS/Android: use AsyncStorage
    try {
      const v = await AsyncStorage.getItem(TOKEN_KEY);
      tokenStorage = v;
      return v;
    } catch (error) {
      console.error("Error reading token from AsyncStorage:", error);
      // Fallback to in-memory
      return tokenStorage;
    }
  },

  async removeToken(): Promise<void> {
    if (isWeb && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(TOKEN_KEY);
    } else {
      // iOS/Android: use AsyncStorage
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } catch (error) {
        console.error("Error removing token from AsyncStorage:", error);
      }
    }
    tokenStorage = null;
  },

  // User data management
  async setUser(user: { id: string; name: string; email: string }): Promise<void> {
    const data = JSON.stringify(user);

    if (isWeb && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(USER_KEY, data);
      userStorage = data;
      return;
    }

    // iOS/Android: use AsyncStorage
    try {
      await AsyncStorage.setItem(USER_KEY, data);
      userStorage = data;
    } catch (error) {
      console.error("Error saving user to AsyncStorage:", error);
      // Fallback to in-memory
      userStorage = data;
    }
  },

  async getUser(): Promise<{ id: string; name: string; email: string } | null> {
    let data: string | null = null;

    if (isWeb && typeof window !== "undefined" && window.localStorage) {
      data = window.localStorage.getItem(USER_KEY);
    } else {
      // iOS/Android: use AsyncStorage
      try {
        data = await AsyncStorage.getItem(USER_KEY);
      } catch (error) {
        console.error("Error reading user from AsyncStorage:", error);
      }
    }

    if (!data) data = userStorage;
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      userStorage = data;
      return parsed;
    } catch {
      return null;
    }
  },

  async removeUser(): Promise<void> {
    if (isWeb && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(USER_KEY);
    } else {
      // iOS/Android: use AsyncStorage
      try {
        await AsyncStorage.removeItem(USER_KEY);
      } catch (error) {
        console.error("Error removing user from AsyncStorage:", error);
      }
    }
    userStorage = null;
  },

  // Clear all auth data
  async clearAuth(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  },

  // Exam progress management - using AsyncStorage for iOS/Android, localStorage for web
  async setExamProgress(examId: string, progress: number, answers: Map<string, { choiceId: string | number; answeredAt: string }>): Promise<void> {
    const progressData = {
      examId,
      progress,
      answers: Array.from(answers.entries()).map(([questionId, data]) => ({
        questionId,
        ...data,
      })),
      updatedAt: new Date().toISOString(),
    };
    const key = `@exam_progress_${examId}`;
    const dataString = JSON.stringify(progressData);
    
    // For web, use localStorage
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, dataString);
      return;
    }
    
    // iOS/Android: use AsyncStorage
    try {
      await AsyncStorage.setItem(key, dataString);
      examProgressStorage.set(key, dataString); // Keep in-memory as cache
    } catch (error) {
      console.error('Error saving exam progress to AsyncStorage:', error);
      // Fallback to in-memory
      examProgressStorage.set(key, dataString);
    }
  },

  async getExamProgress(examId: string): Promise<{ progress: number; answers: Array<{ questionId: string; choiceId: string | number; answeredAt: string }> } | null> {
    const key = `@exam_progress_${examId}`;
    let data: string | null = null;
    
    // Try localStorage first (web)
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      data = window.localStorage.getItem(key);
    } else {
      // iOS/Android: use AsyncStorage
      try {
        data = await AsyncStorage.getItem(key);
        if (data) {
          examProgressStorage.set(key, data); // Cache in memory
        }
      } catch (error) {
        console.error('Error reading exam progress from AsyncStorage:', error);
      }
    }
    
    // Fallback to in-memory storage
    if (!data) {
      data = examProgressStorage.get(key) || null;
    }
    
    if (data) {
      try {
        const parsed = JSON.parse(data);
        return {
          progress: parsed.progress,
          answers: parsed.answers || [],
        };
      } catch (e) {
        console.error('Error parsing exam progress:', e);
        return null;
      }
    }
    return null;
  },

  async removeExamProgress(examId: string): Promise<void> {
    const key = `@exam_progress_${examId}`;
    
    // Remove from localStorage (web)
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    } else {
      // iOS/Android: use AsyncStorage
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing exam progress from AsyncStorage:', error);
      }
    }
    // Remove from in-memory storage
    examProgressStorage.delete(key);
  },

  // Flashcard progress management - using AsyncStorage for iOS/Android, localStorage for web
  async setFlashcardProgress(setId: string, rememberedCards: string[], notRememberedCards: string[]): Promise<void> {
    const progressData = {
      setId,
      rememberedCards,
      notRememberedCards,
      updatedAt: new Date().toISOString(),
    };
    const key = `@flashcard_progress_${setId}`;
    const dataString = JSON.stringify(progressData);
    
    // For web, use localStorage
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, dataString);
      return;
    }
    
    // iOS/Android: use AsyncStorage
    try {
      await AsyncStorage.setItem(key, dataString);
      examProgressStorage.set(key, dataString); // Keep in-memory as cache
    } catch (error) {
      console.error('Error saving flashcard progress to AsyncStorage:', error);
      // Fallback to in-memory
      examProgressStorage.set(key, dataString);
    }
  },

  async getFlashcardProgress(setId: string): Promise<{ rememberedCards: string[]; notRememberedCards: string[] } | null> {
    const key = `@flashcard_progress_${setId}`;
    let data: string | null = null;
    
    // Try localStorage first (web)
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      data = window.localStorage.getItem(key);
    } else {
      // iOS/Android: use AsyncStorage
      try {
        data = await AsyncStorage.getItem(key);
        if (data) {
          examProgressStorage.set(key, data); // Cache in memory
        }
      } catch (error) {
        console.error('Error reading flashcard progress from AsyncStorage:', error);
      }
    }
    
    // Fallback to in-memory storage
    if (!data) {
      data = examProgressStorage.get(key) || null;
    }
    
    if (data) {
      try {
        const parsed = JSON.parse(data);
        return {
          rememberedCards: parsed.rememberedCards || [],
          notRememberedCards: parsed.notRememberedCards || [],
        };
      } catch (e) {
        console.error('Error parsing flashcard progress:', e);
        return null;
      }
    }
    return null;
  },

  async getAllFlashcardProgress(): Promise<Array<{ setId: string; rememberedCards: string[]; notRememberedCards: string[]; updatedAt: string }>> {
    const results: Array<{ setId: string; rememberedCards: string[]; notRememberedCards: string[]; updatedAt: string }> = [];
    
    // Get from localStorage (web)
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('@flashcard_progress_')) {
          try {
            const data = JSON.parse(window.localStorage.getItem(key) || '{}');
            results.push({
              setId: data.setId,
              rememberedCards: data.rememberedCards || [],
              notRememberedCards: data.notRememberedCards || [],
              updatedAt: data.updatedAt || '',
            });
          } catch (e) {
            console.error('Error parsing flashcard progress:', e);
          }
        }
      }
    } else {
      // iOS/Android: get all keys from AsyncStorage
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const flashcardKeys = allKeys.filter(key => key.startsWith('@flashcard_progress_'));
        const items = await AsyncStorage.multiGet(flashcardKeys);
        
        items.forEach(([key, value]) => {
          if (value) {
            try {
              const data = JSON.parse(value);
              results.push({
                setId: data.setId,
                rememberedCards: data.rememberedCards || [],
                notRememberedCards: data.notRememberedCards || [],
                updatedAt: data.updatedAt || '',
              });
              examProgressStorage.set(key, value); // Cache in memory
            } catch (e) {
              console.error('Error parsing flashcard progress:', e);
            }
          }
        });
      } catch (error) {
        console.error('Error reading all flashcard progress from AsyncStorage:', error);
      }
    }
    
    // Fallback: Get from in-memory storage
    examProgressStorage.forEach((value, key) => {
      if (key.startsWith('@flashcard_progress_')) {
        try {
          const data = JSON.parse(value);
          // Only add if not already in results
          if (!results.find(r => r.setId === data.setId)) {
            results.push({
              setId: data.setId,
              rememberedCards: data.rememberedCards || [],
              notRememberedCards: data.notRememberedCards || [],
              updatedAt: data.updatedAt || '',
            });
          }
        } catch (e) {
          console.error('Error parsing flashcard progress:', e);
        }
      }
    });
    
    return results;
  },

  // Whiteboard storage management - using AsyncStorage for iOS/Android, localStorage for web
  async saveWhiteboard(whiteboardId: string, data: {
    paths: Array<{ d: string; stroke: string; strokeWidth: number; opacity?: number }>;
    backgroundColor: string;
    gridType: string;
    updatedAt: string;
  }): Promise<void> {
    const key = `@whiteboard_${whiteboardId}`;
    const dataString = JSON.stringify(data);
    
    // For web, use localStorage
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, dataString);
      return;
    }
    
    // iOS/Android: use AsyncStorage
    try {
      await AsyncStorage.setItem(key, dataString);
      examProgressStorage.set(key, dataString); // Keep in-memory as cache
    } catch (error) {
      console.error('Error saving whiteboard to AsyncStorage:', error);
      // Fallback to in-memory
      examProgressStorage.set(key, dataString);
    }
  },

  async loadWhiteboard(whiteboardId: string): Promise<{
    paths: Array<{ d: string; stroke: string; strokeWidth: number; opacity?: number }>;
    backgroundColor: string;
    gridType: string;
    updatedAt: string;
  } | null> {
    const key = `@whiteboard_${whiteboardId}`;
    let data: string | null = null;
    
    // Try localStorage first (web)
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      data = window.localStorage.getItem(key);
    } else {
      // iOS/Android: use AsyncStorage
      try {
        data = await AsyncStorage.getItem(key);
        if (data) {
          examProgressStorage.set(key, data); // Cache in memory
        }
      } catch (error) {
        console.error('Error reading whiteboard from AsyncStorage:', error);
      }
    }
    
    // Fallback to in-memory storage
    if (!data) {
      data = examProgressStorage.get(key) || null;
    }
    
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error parsing whiteboard data:', e);
        return null;
      }
    }
    return null;
  },

  async getAllWhiteboards(): Promise<Array<{ id: string; updatedAt: string }>> {
    const results: Array<{ id: string; updatedAt: string }> = [];
    
    // Get from localStorage (web)
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('@whiteboard_')) {
          try {
            const data = JSON.parse(window.localStorage.getItem(key) || '{}');
            const id = key.replace('@whiteboard_', '');
            results.push({
              id,
              updatedAt: data.updatedAt || '',
            });
          } catch (e) {
            console.error('Error parsing whiteboard:', e);
          }
        }
      }
    } else {
      // iOS/Android: get all keys from AsyncStorage
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const whiteboardKeys = allKeys.filter(key => key.startsWith('@whiteboard_'));
        const items = await AsyncStorage.multiGet(whiteboardKeys);
        
        items.forEach(([key, value]) => {
          if (value) {
            try {
              const data = JSON.parse(value);
              const id = key.replace('@whiteboard_', '');
              results.push({
                id,
                updatedAt: data.updatedAt || '',
              });
              examProgressStorage.set(key, value); // Cache in memory
            } catch (e) {
              console.error('Error parsing whiteboard:', e);
            }
          }
        });
      } catch (error) {
        console.error('Error reading all whiteboards from AsyncStorage:', error);
      }
    }
    
    // Fallback: Get from in-memory storage
    examProgressStorage.forEach((value, key) => {
      if (key.startsWith('@whiteboard_')) {
        try {
          const data = JSON.parse(value);
          const id = key.replace('@whiteboard_', '');
          // Only add if not already in results
          if (!results.find(r => r.id === id)) {
            results.push({
              id,
              updatedAt: data.updatedAt || '',
            });
          }
        } catch (e) {
          console.error('Error parsing whiteboard:', e);
        }
      }
    });
    
    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async deleteWhiteboard(whiteboardId: string): Promise<void> {
    const key = `@whiteboard_${whiteboardId}`;
    
    // Remove from localStorage (web)
    if (isWeb && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    } else {
      // iOS/Android: use AsyncStorage
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing whiteboard from AsyncStorage:', error);
      }
    }
    // Remove from in-memory storage
    examProgressStorage.delete(key);
  },
};

