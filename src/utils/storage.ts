// Simple storage utility for token management
// Web: dùng localStorage nếu có
// Native (hiện tại): dùng in-memory (không persist sau khi kill app)

const TOKEN_KEY = "@auth_token";
const USER_KEY = "@auth_user";

let tokenStorage: string | null = null;
let userStorage: string | null = null;
let examProgressStorage: Map<string, string> = new Map();

export const storage = {
  // Token management
  async setToken(token: string): Promise<void> {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(TOKEN_KEY, token);
      tokenStorage = token;
      return;
    }
    // Native fallback: in-memory only
    tokenStorage = token;
  },

  async getToken(): Promise<string | null> {
    if (typeof window !== "undefined" && window.localStorage) {
      const v = window.localStorage.getItem(TOKEN_KEY);
      tokenStorage = v;
      return v;
    }
    // Native fallback
    return tokenStorage;
  },

  async removeToken(): Promise<void> {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    tokenStorage = null;
  },

  // User data management
  async setUser(user: { id: string; name: string; email: string }): Promise<void> {
    const data = JSON.stringify(user);

    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(USER_KEY, data);
      userStorage = data;
      return;
    }

    // Native fallback
    userStorage = data;
  },

  async getUser(): Promise<{ id: string; name: string; email: string } | null> {
    let data: string | null = null;

    if (typeof window !== "undefined" && window.localStorage) {
      data = window.localStorage.getItem(USER_KEY);
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
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(USER_KEY);
    }
    userStorage = null;
  },

  // Clear all auth data
  async clearAuth(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  },

  // Exam progress management - using in-memory storage for mobile, localStorage for web
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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, dataString);
    }
    // For mobile, use in-memory storage
    examProgressStorage.set(key, dataString);
  },

  async getExamProgress(examId: string): Promise<{ progress: number; answers: Array<{ questionId: string; choiceId: string | number; answeredAt: string }> } | null> {
    const key = `@exam_progress_${examId}`;
    let data: string | null = null;
    
    // Try localStorage first (web)
    if (typeof window !== 'undefined' && window.localStorage) {
      data = window.localStorage.getItem(key);
    }
    
    // Fallback to in-memory storage (mobile)
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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    // Remove from in-memory storage (mobile)
    examProgressStorage.delete(key);
  },

  // Flashcard progress management - using in-memory storage for mobile, localStorage for web
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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, dataString);
    }
    // For mobile, use in-memory storage
    examProgressStorage.set(key, dataString);
  },

  async getFlashcardProgress(setId: string): Promise<{ rememberedCards: string[]; notRememberedCards: string[] } | null> {
    const key = `@flashcard_progress_${setId}`;
    let data: string | null = null;
    
    // Try localStorage first (web)
    if (typeof window !== 'undefined' && window.localStorage) {
      data = window.localStorage.getItem(key);
    }
    
    // Fallback to in-memory storage (mobile)
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
    if (typeof window !== 'undefined' && window.localStorage) {
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
    }
    
    // Get from in-memory storage (mobile)
    examProgressStorage.forEach((value, key) => {
      if (key.startsWith('@flashcard_progress_')) {
        try {
          const data = JSON.parse(value);
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
    });
    
    return results;
  },

  // Whiteboard storage management
  async saveWhiteboard(whiteboardId: string, data: {
    paths: Array<{ d: string; stroke: string; strokeWidth: number; opacity?: number }>;
    backgroundColor: string;
    gridType: string;
    updatedAt: string;
  }): Promise<void> {
    const key = `@whiteboard_${whiteboardId}`;
    const dataString = JSON.stringify(data);
    
    // For web, use localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, dataString);
    }
    // For mobile, use in-memory storage
    examProgressStorage.set(key, dataString);
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
    if (typeof window !== 'undefined' && window.localStorage) {
      data = window.localStorage.getItem(key);
    }
    
    // Fallback to in-memory storage (mobile)
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
    if (typeof window !== 'undefined' && window.localStorage) {
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
    }
    
    // Get from in-memory storage (mobile)
    examProgressStorage.forEach((value, key) => {
      if (key.startsWith('@whiteboard_')) {
        try {
          const data = JSON.parse(value);
          const id = key.replace('@whiteboard_', '');
          results.push({
            id,
            updatedAt: data.updatedAt || '',
          });
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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    // Remove from in-memory storage (mobile)
    examProgressStorage.delete(key);
  },
};

