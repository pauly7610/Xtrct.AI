// app/context/AuthContext.js
import React, { createContext, useState, useContext } from 'react';
import Auth0 from 'react-native-auth0';
import config from '../config/authConfig';

const auth0 = new Auth0({
  domain: config.domain,
  clientId: config.clientId,
});

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Add an error state

  const login = async () => {
    try {
      setLoading(true);
      setError(null); // Reset any previous errors
      const credentials = await auth0.webAuth.authorize({
        scope: config.scopes.join(' '),
      });
      const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });
      setUser(userInfo);
    } catch (error) {
      console.log(error);
      setError('Login failed. Please try again.'); // Set error message
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await auth0.webAuth.clearSession({});
      setUser(null);
    } catch (error) {
      console.log(error);
      setError('Logout failed. Please try again.'); // Set error message
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => {
    return user !== null; // Check if user is authenticated
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
