// Simple storage utility for token management
// Using React Native's built-in storage mechanism
// Can be replaced with AsyncStorage later if needed

const TOKEN_KEY = "@auth_token";
const USER_KEY = "@auth_user";

// For now, using in-memory storage
// In production, should use AsyncStorage or SecureStore
let tokenStorage: string | null = null;
let userStorage: string | null = null;

export const storage = {
  // Token management
  async setToken(token: string): Promise<void> {
    tokenStorage = token;
    // TODO: Replace with AsyncStorage when available
    // await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return tokenStorage;
    // TODO: Replace with AsyncStorage when available
    // return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    tokenStorage = null;
    // TODO: Replace with AsyncStorage when available
    // await AsyncStorage.removeItem(TOKEN_KEY);
  },

  // User data management
  async setUser(user: { id: string; name: string; email: string }): Promise<void> {
    userStorage = JSON.stringify(user);
    // TODO: Replace with AsyncStorage when available
    // await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<{ id: string; name: string; email: string } | null> {
    if (!userStorage) return null;
    return JSON.parse(userStorage);
    // TODO: Replace with AsyncStorage when available
    // const userStr = await AsyncStorage.getItem(USER_KEY);
    // return userStr ? JSON.parse(userStr) : null;
  },

  async removeUser(): Promise<void> {
    userStorage = null;
    // TODO: Replace with AsyncStorage when available
    // await AsyncStorage.removeItem(USER_KEY);
  },

  // Clear all auth data
  async clearAuth(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  },
};

