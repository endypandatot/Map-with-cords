import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authApi.getUser()
            .then(userData => {
                setUser(userData);
                if (userData) {
                    return authApi.getProfile();
                }
                return null;
            })
            .then(profileData => {
                if (profileData) {
                    setUser(prev => ({
                        ...prev,
                        first_name: profileData.first_name || prev?.first_name,
                        last_name: profileData.last_name || prev?.last_name
                    }));
                }
                setProfile(profileData);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const login = async (username, password) => {
        const userData = await authApi.login(username, password);
        setUser(userData);
        const profileData = await authApi.getProfile();
        setProfile(profileData);
        return userData;
    };

    const register = async (username, email, password, password2, firstName, lastName) => {
        const userData = await authApi.register(username, email, password, password2, firstName, lastName);
        setUser(userData);
        const profileData = await authApi.getProfile();
        setProfile(profileData);
        return userData;
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
        setProfile(null);
    };

    const updateProfile = async () => {
        const profileData = await authApi.getProfile();
        setProfile(profileData);
        if (profileData) {
            setUser(prev => ({
                ...prev,
                first_name: profileData.first_name || prev?.first_name,
                last_name: profileData.last_name || prev?.last_name
            }));
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};