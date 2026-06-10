import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children, defaultUser }) {
  // Initialize with the Supabase Admin user passed from the server side wrapper
  const [user, setUser] = useState(defaultUser || null);

  const login = (username, password) => {
    // Left as fallback mock sign-in if needed
    if (username === 'admin') {
      setUser({ name: 'Admin', role: 'admin' });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
