import { User } from '../types';

const STATIC_EMAIL = 'admin@sundayschicken.com';
const STATIC_PASS = 'Admin@123';

const TOKEN_KEY = 'sunday_chicken_token';
const USER_KEY = 'sunday_chicken_user';

// Helper delay for UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const login = async (email: string, password: string): Promise<User> => {
  await delay(800);

  if (email === STATIC_EMAIL && password === STATIC_PASS) {
    const user: User = {
      id: 'admin_user',
      name: 'Administrator',
      email: email,
      token: 'static_admin_token_' + Date.now()
    };
    localStorage.setItem(TOKEN_KEY, user.token || '');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }
  
  throw new Error('Incorrect email or password');
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};