import Cookies from "js-cookie";

import { AUTH_TOKEN_KEY } from "@/lib/constants";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const local = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (local) return local;
  return window.sessionStorage.getItem(AUTH_TOKEN_KEY);
};

export const setToken = (token: string, remember: boolean): void => {
  if (typeof window === "undefined") return;
  if (remember) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } else {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7, secure: true, sameSite: "Strict" });
};

export const removeToken = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  Cookies.remove(AUTH_TOKEN_KEY);
};
