"use client";

import { useRouter } from "next/navigation";
import {
    PropsWithChildren,
    createContext,
    useCallback,
    useEffect,
    useState,
} from "react";

import { api } from "@/lib/api";
import { AUTH_TOKEN_KEY } from "@/lib/constants";
import type { LoginRequest, RegisterRequest } from "@/lib/api/modules/auth";
import type { AuthContextType, AuthState } from "@/types/auth";

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
    const router = useRouter();
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isAuthenticated: false,
    });

    useEffect(() => {
        let isActive = true;

        if (typeof window === "undefined") {
            return () => {
                isActive = false;
            };
        }

        const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

        if (!token) {
            setState({ user: null, isAuthenticated: false, isLoading: false });
            return () => {
                isActive = false;
            };
        }

        const verify = async () => {
            try {
                const response = await api.auth.me();
                if (!isActive) return;
                setState({ user: response.data.user, isAuthenticated: true, isLoading: false });
            } catch (error) {
                if (!isActive) return;
                window.localStorage.removeItem(AUTH_TOKEN_KEY);
                setState({ user: null, isAuthenticated: false, isLoading: false });
                console.error("Auth verification failed", error);
            }
        };

        void verify();

        return () => {
            isActive = false;
        };
    }, []);

    const login = useCallback(
        async (payload: LoginRequest): Promise<void> => {
            setState((prev) => ({ ...prev, isLoading: true }));
            try {
                const response = await api.auth.login(payload);
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
                }
                setState({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } catch (error) {
                setState({ user: null, isAuthenticated: false, isLoading: false });
                throw error;
            }
        },
        []
    );

    const register = useCallback(
        async (payload: RegisterRequest): Promise<void> => {
            setState((prev) => ({ ...prev, isLoading: true }));
            try {
                const response = await api.auth.register(payload);
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
                }
                setState({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } catch (error) {
                setState({ user: null, isAuthenticated: false, isLoading: false });
                throw error;
            }
        },
        []
    );

    const logout = useCallback(async (): Promise<void> => {
        setState((prev) => ({ ...prev, isLoading: true }));
        try {
            await api.auth.logout();
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(AUTH_TOKEN_KEY);
            }
            setState({ user: null, isAuthenticated: false, isLoading: false });
            router.push("/login");
        }
    }, [router]);

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
