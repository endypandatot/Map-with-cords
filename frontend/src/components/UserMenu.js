import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';   // важно!
import AuthModal from './AuthModal';
import ProfileModal from './ProfileModal';

const UserMenu = () => {
    const { user, profile, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    if (user) {
        const subscriptionClass = profile?.subscription_type === 'premium' ? 'premium-border' :
                                 (profile?.subscription_type === 'max' ? 'max-border' : '');
        return (
            <div className={`user-menu ${subscriptionClass}`}>
                <span className="user-name" onClick={() => setShowProfileModal(true)}>
                    {user.username}
                </span>
                <button className="logout-btn" onClick={logout}>Выйти</button>
                {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
            </div>
        );
    }

    return (
        <>
            <button className="user-icon-btn" onClick={() => setShowAuthModal(true)}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="14" fill="#536C45" stroke="white" strokeWidth="2"/>
                    <path d="M16 16C18.2091 16 20 14.2091 20 12C20 9.79086 18.2091 8 16 8C13.7909 8 12 9.79086 12 12C12 14.2091 13.7909 16 16 16Z" fill="white"/>
                    <path d="M16 18C12.6863 18 10 20.6863 10 24H22C22 20.6863 19.3137 18 16 18Z" fill="white"/>
                </svg>
            </button>
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        </>
    );
};

export default UserMenu;