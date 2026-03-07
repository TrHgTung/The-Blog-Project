import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const normalizeUser = (decoded) => {
        if (!decoded) return null;
        return {
            ...decoded,
            id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded.sub || decoded.id,
            username: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded.unique_name || decoded.username,
            role: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"] || decoded.role
        };
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 > Date.now()) {
                    setUser(normalizeUser(decoded));
                } else {
                    localStorage.removeItem('token');
                }
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = (token) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser(normalizeUser(decoded));
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
