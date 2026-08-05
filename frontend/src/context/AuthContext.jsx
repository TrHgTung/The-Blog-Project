'use client';
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password, captchaToken, idempotencyKey) => {
        console.log('Login attempt for:', username);
        const headers = idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {};
        const response = await api.post('/auth/login', { username, password, captchaToken }, { headers });
        console.log('Login Response:', response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
        return response.data;
    };

    const register = async (userData, idempotencyKey) => {
        const headers = idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {};
        const response = await api.post('/auth/register', userData, { headers });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('myCurrentCharacters');
        setUser(null);
    };

    const updateUserLocal = (newData) => {
        if (!user) return;
        const updatedUser = { ...user, ...newData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const checkIsBirthday = (dob) => {
        if (!dob) return false;
        const birthDate = new Date(dob);
        const today = new Date();
        return birthDate.getDate() === today.getDate() && 
               birthDate.getMonth() === today.getMonth();
    };

    const isBirthday = checkIsBirthday(user?.dateOfBirth);

    return (
        <AuthContext.Provider value={{ user, loading, setUser, login, register, logout, isAdmin: user?.isAdmin, updateUserLocal, isBirthday }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);


