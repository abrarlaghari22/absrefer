import { User } from "@shared/schema";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
  balance: string;
  referralCode: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

class AuthService {
  private token: string | null = null;
  private user: AuthUser | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("auth_user");
      if (userData) {
        try {
          this.user = JSON.parse(userData);
        } catch {
          this.user = null;
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      if (this.token) {
        localStorage.setItem("auth_token", this.token);
      } else {
        localStorage.removeItem("auth_token");
      }
      
      if (this.user) {
        localStorage.setItem("auth_user", JSON.stringify(this.user));
      } else {
        localStorage.removeItem("auth_user");
      }
    }
  }

  setAuth(authData: AuthResponse) {
    this.token = authData.token;
    this.user = authData.user;
    this.saveToStorage();
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    this.saveToStorage();
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  isAdmin(): boolean {
    return this.isAuthenticated() && this.user?.role === "admin";
  }

  getAuthHeaders(): Record<string, string> {
    if (this.token) {
      return {
        Authorization: `Bearer ${this.token}`,
      };
    }
    return {};
  }
}

export const authService = new AuthService();
