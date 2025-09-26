// Local Authentication utilities (no external services)
import { AuthUser } from '@/types';

export class AuthService {
  private static instance: AuthService;
  private user: AuthUser | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Mock login for local development
  login(role: 'PLATFORM_ADMIN' | 'REVIEWER' = 'PLATFORM_ADMIN') {
    this.user = {
      sub: 'local-user-001',
      email: role === 'PLATFORM_ADMIN' ? 'admin@ediworks.local' : 'reviewer@ediworks.local',
      platformRole: role,
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(this.user));
    }
    return this.user;
  }

  getUser(): AuthUser | null {
    if (!this.user && typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        try {
          this.user = JSON.parse(stored);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
        }
      }
    }
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.getUser() !== null;
  }

  hasPermission(action: 'read' | 'write'): boolean {
    const user = this.getUser();
    if (!user) return false;

    if (action === 'read') {
      return user.platformRole === 'PLATFORM_ADMIN' || user.platformRole === 'REVIEWER';
    }
    
    if (action === 'write') {
      return user.platformRole === 'PLATFORM_ADMIN';
    }
    
    return false;
  }

  logout() {
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
  }
}

export const auth = AuthService.getInstance();