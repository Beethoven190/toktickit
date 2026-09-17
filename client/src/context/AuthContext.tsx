import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AuthUser,
  getAuthToken,
  setAuthToken,
  loginApi,
  logoutApi,
  getMeApi,
  changePasswordApi,
} from "../api.js";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser && !!getAuthToken());

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setIsLoading(false);
      return;
    }

    const storedToken = getAuthToken();
    if (storedToken) {
      getMeApi()
        .then((fetchedUser) => {
          setUser(fetchedUser);
        })
        .catch(() => {
          setUser(null);
          setAuthToken(null);
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [initialUser]);

  const login = async (email: string, password: string) => {
    const res = await loginApi(email, password);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await changePasswordApi(currentPassword, newPassword);
    setUser(res.user);
  };

  const refreshUser = async () => {
    try {
      const fetchedUser = await getMeApi();
      setUser(fetchedUser);
    } catch {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
