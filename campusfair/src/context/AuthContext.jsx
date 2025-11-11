import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);

  const login = (userData) => {
    setUser(userData);
    setIsSeller(userData.isSeller);
  };

  const logout = () => {
    setUser(null);
    setIsSeller(false);
  };

  const value = { user, isSeller, login, logout, setIsSeller };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
