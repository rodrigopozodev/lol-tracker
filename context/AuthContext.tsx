"use client";
import React, { createContext, useState } from "react";
export const AuthContext = createContext({ user: null as null | { email: string }, login: (e: string) => {}, logout: () => {} });
export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const login = (email: string) => setUser({ email });
  const logout = () => setUser(null);
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
