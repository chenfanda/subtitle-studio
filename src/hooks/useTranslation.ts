import { useSettingsStore } from '@/stores/useSettingsStore';
import { LOCALE_EN } from '@/constants/locales';

/**
 * Custom hook for Internationalization.
 * Uses 'zh-CN' (Chinese) as the source of truth/keys.
 * Falls back to the key itself if no translation is found.
 */
export const useTranslation = () => {
    const language = useSettingsStore((state) => state.language);

    const t = (key: string): string => {
        // If language is Chinese, return the key directly (key is the Chinese text)
        if (language === 'zh-CN') {
            return key;
        }

        // If language is English, look up in dictionary
        if (language === 'en-US') {
            const translation = LOCALE_EN[key];
            return translation || key; // Fallback to Chinese key if translation missing
        }

        return key;
    };

    return { t, language };
};
