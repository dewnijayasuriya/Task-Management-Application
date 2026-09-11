"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, loginUser, registerUser } from "@/services/authService";
import { setAuthToken, clearAuthToken, getAuthToken } from "@/services/api";

const AuthContext = createContext(null); // Creates a shared authentication context that components can access.

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Indicates whether the authentication state is still being determined (e.g., checking if a user is logged in).
  const router = useRouter(); 

  const loadUser = useCallback(async () => {
    const token = getAuthToken(); // Gets the JWT token from storage.
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Fetches the current user's information using the JWT token.
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // The useEffect hook runs the loadUser function when the component mounts, ensuring that the authentication state is checked and updated accordingly.
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { token, user: loggedInUser } = await loginUser(email, password); // Calls the loginUser function to authenticate the user and retrieve the JWT token and user information.
    setAuthToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (name, email, password) => {
    const { token, user: newUser } = await registerUser(name, email, password);
    setAuthToken(token);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    router.push("/login");
  };

  //This makes authentication information available to all child components.
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
