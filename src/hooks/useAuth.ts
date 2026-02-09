"use client";

import { useEffect, useState } from 'react';
import { User } from '@/types';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get user from localStorage
        const getUserFromStorage = () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Error loading user from storage:', error);
            } finally {
                setLoading(false);
            }
        };

        getUserFromStorage();

        // Listen for storage changes (for multi-tab support)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user') {
                if (e.newValue) {
                    setUser(JSON.parse(e.newValue));
                } else {
                    setUser(null);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    return { user, loading, logout };
}
