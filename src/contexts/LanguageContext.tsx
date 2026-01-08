import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { translations, Language, Translations } from '@/i18n/translations';
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'app-language';
const DEFAULT_LANGUAGE: Language = 'tr';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // First check localStorage for cached value
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && (stored === 'tr' || stored === 'en' || stored === 'es')) {
      return stored as Language;
    }
    return DEFAULT_LANGUAGE;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);

      if (newUserId) {
        // Fetch user settings from database
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('language')
            .eq('user_id', newUserId)
            .maybeSingle();

          if (!error && data?.language) {
            const dbLang = data.language as Language;
            if (['tr', 'en', 'es'].includes(dbLang)) {
              setLanguageState(dbLang);
              localStorage.setItem(LANGUAGE_STORAGE_KEY, dbLang);
            }
          } else if (!data) {
            // Create default settings for new user
            await supabase
              .from('user_settings')
              .insert({
                user_id: newUserId,
                language: DEFAULT_LANGUAGE,
                theme: 'system',
                notifications_enabled: true,
              });
          }
        } catch (err) {
          console.error('Error fetching user settings:', err);
        }
      }
      setIsLoading(false);
    });

    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

    // If user is logged in, save to database
    if (userId) {
      try {
        await supabase
          .from('user_settings')
          .update({ language: lang })
          .eq('user_id', userId);
      } catch (err) {
        console.error('Error updating language in database:', err);
      }
    }
  }, [userId]);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export type { Language };
