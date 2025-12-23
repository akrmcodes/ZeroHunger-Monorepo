import type { LoginRequest, RegisterRequest } from "@/lib/api";
import type { User } from "@/types/api";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (data: LoginRequest, remember?: boolean) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}
