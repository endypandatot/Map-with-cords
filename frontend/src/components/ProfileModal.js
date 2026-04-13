import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';

const ProfileModal = ({ onClose }) => {
    const { user, profile, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Автообновление статуса подписки каждые 5 секунд (для тестов)
        const interval = setInterval(() => {
            updateProfile();
        }, 5000);
        return () => clearInterval(interval);
    }, [updateProfile]);

    if (!user || !profile) return null;

    const handleSubscribe = async (type, testMode = false) => {
        setLoading(true);
        try {
            await authApi.changeSubscription(type, testMode);
            await updateProfile();
        } catch (err) {
            console.error(err);
            alert('Ошибка при смене подписки');
        } finally {
            setLoading(false);
        }
    };

    const daysLeft = profile.days_left || 0;
    const isActive = profile.subscription_active;
    const subType = profile.subscription_type;

    const modalContent = (
        <div className="modal-overlay" onClick={onClose}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="profile-modal-header">
                    <span>Профиль пользователя</span>
                    <button className="close-modal-btn" onClick={onClose}>×</button>
                </div>
                <div className="profile-modal-body">
                    {/* Левая колонка */}
                    <div className="profile-info">
                        <h3>Личные данные</h3>
                        <p><strong>Имя:</strong> {user.first_name || '—'}</p>
                        <p><strong>Фамилия:</strong> {user.last_name || '—'}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Всего маршрутов:</strong> {profile.routes_count} / {profile.max_routes}</p>
                        <p><strong>Макс. точек в маршруте:</strong> {profile.max_points_per_route}</p>
                        <div className="subscription-status">
                            <strong>Статус подписки:</strong>
                            <span className={`subscription-badge ${subType}`}>
                                {subType === 'free' ? 'Бесплатный' : subType === 'premium' ? 'Обычный' : 'Максимальный'}
                            </span>
                            {isActive && subType !== 'free' && (
                                <span> (активна ещё {daysLeft} дн.)</span>
                            )}
                            {!isActive && subType !== 'free' && (
                                <span> (истекла)</span>
                            )}
                        </div>
                    </div>

                    {/* Правая колонка */}
                    <div className="subscription-plans">
                        <h3>Планы подписки</h3>
                        <div className="plan-card free">
                            <h4>Бесплатный</h4>
                            <p>Маршрутов: до 5</p>
                            <p>Точек в маршруте: до 20</p>
                            <button onClick={() => handleSubscribe('free')} disabled={loading || subType === 'free'}>
                                {subType === 'free' ? 'Активен' : 'Выбрать'}
                            </button>
                        </div>
                        <div className="plan-card premium">
                            <h4>Обычный</h4>
                            <p>Маршрутов: до 10</p>
                            <p>Точек в маршруте: до 30</p>
                            <button onClick={() => handleSubscribe('premium', false)} disabled={loading || subType === 'premium'}>
                                {subType === 'premium' ? (isActive ? 'Активен' : 'Истекла') : 'Подключить'}
                            </button>
                            {process.env.NODE_ENV === 'development' && (
                                <button
                                    onClick={() => handleSubscribe('premium', true)}
                                    disabled={loading}
                                    style={{ marginTop: '8px', background: '#f39c12', width: '100%' }}
                                >
                                    Тест (15 сек)
                                </button>
                            )}
                        </div>
                        <div className="plan-card max">
                            <h4>Максимальный</h4>
                            <p>Маршрутов: до 15</p>
                            <p>Точек в маршруте: до 40</p>
                            <button onClick={() => handleSubscribe('max', false)} disabled={loading || subType === 'max'}>
                                {subType === 'max' ? (isActive ? 'Активен' : 'Истекла') : 'Подключить'}
                            </button>
                            {process.env.NODE_ENV === 'development' && (
                                <button
                                    onClick={() => handleSubscribe('max', true)}
                                    disabled={loading}
                                    style={{ marginTop: '8px', background: '#f39c12', width: '100%' }}
                                >
                                    Тест (15 сек)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default ProfileModal;