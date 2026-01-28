/**
 * Utility to retrieve the current Access Token from localStorage
 */
export const getAuthToken = (): string | null => {
    try {
        const userStorage = localStorage.getItem('user-storage');
        if (!userStorage) return null;

        const parsed = JSON.parse(userStorage);
        return parsed.state?.accessToken || null;
    } catch (e) {
        return null;
    }
};
