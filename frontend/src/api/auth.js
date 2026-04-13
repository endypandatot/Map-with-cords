import apiClient from './client';

export const authApi = {
    getUser: async () => {
        try {
            const response = await apiClient.get('/user/');
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                return null;
            }
            throw error;
        }
    },

    login: async (username, password) => {
        const response = await apiClient.post('/login/', { username, password });
        return response.data;
    },

    register: async (username, email, password, password2, firstName, lastName) => {
        const response = await apiClient.post('/register/', {
            username,
            email,
            password,
            password2,
            first_name: firstName,
            last_name: lastName
        });
        return response.data;
    },

    logout: async () => {
        await apiClient.post('/logout/');
    },

    // НОВЫЕ МЕТОДЫ ДЛЯ ПРОФИЛЯ И ПОДПИСКИ
    getProfile: async () => {
        const response = await apiClient.get('/profile/');
        return response.data;
    },

    changeSubscription: async (subscriptionType, testMode = false) => {
        const response = await apiClient.post('/change-subscription/', {
            subscription_type: subscriptionType,
            test_mode: testMode
        });
        return response.data;
    },
};