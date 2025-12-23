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
import { getToken, removeToken, setToken } from "@/lib/utils/auth-storage";
import type { LoginRequest, RegisterRequest, User } from "@/lib/api";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isActive = true;

        if (typeof window === "undefined") {
            return () => {
                isActive = false;
            };
        }

        const token = getToken();

        if (!token) {
            setUser(null);
            setIsLoading(false);
            return () => {
                isActive = false;
            };
        }

        const verify = async () => {
            try {
                const response = await api.auth.me();
                if (!isActive) return;
                setUser(response.data.user);
                setIsLoading(false);
            } catch (error) {
                if (!isActive) return;
                removeToken();
                setUser(null);
                setIsLoading(false);
                console.error("Auth verification failed", error);
            }
        };

        void verify();

        return () => {
            isActive = false;
        };
    }, []);

    const login = useCallback(
        async (payload: LoginRequest, remember = true): Promise<void> => {
            setIsLoading(true);
            try {
                const response = await api.auth.login(payload);
                setToken(response.data.token, remember);
                setUser(response.data.user);
                setIsLoading(false);
                router.refresh();
                router.replace("/dashboard");
            } catch (error) {
                setUser(null);
                setIsLoading(false);
                throw error;
            }
        },
        [router]
    );

    const register = useCallback(
        async (payload: RegisterRequest): Promise<void> => {
            setIsLoading(true);
            try {
                const response = await api.auth.register(payload);
                setToken(response.data.token, true);
                setUser(response.data.user);
                setIsLoading(false);
                router.refresh();
                router.replace("/dashboard");
            } catch (error) {
                setUser(null);
                setIsLoading(false);
                throw error;
            }
        },
        [router]
    );

    const logout = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        try {
            await api.auth.logout();
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            removeToken();
            setUser(null);
            setIsLoading(false);
            router.push("/login");
        }
    }, [router]);

    const updateUser = useCallback((nextUser: User) => {
        setUser(nextUser);
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, isLoading, login, register, logout, updateUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}
