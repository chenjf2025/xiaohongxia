"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type UserContextType = {
    user: any | null;
    loading: boolean;
    login: (token: string, userData: any) => void;
    logout: () => void;
};

const AuthContext = createContext<UserContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch('/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                    } else {
                        localStorage.removeItem('token');
                    }
                } catch (error) {
                    console.error('Auth verification failed', error);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = (token: string, userData: any) => {
        localStorage.setItem('token', token);
        setUser(userData);
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
