import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'tr' | 'en' | 'es';

interface Translations {
  // Auth page
  accountPlanning: string;
  accountPlanningDescription: string;
  login: string;
  signup: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  loggingIn: string;
  signingUp: string;
  termsAgreement: string;
  fillAllFields: string;
  passwordsNotMatch: string;
  passwordMinLength: string;
  invalidCredentials: string;
  emailAlreadyRegistered: string;
  loginSuccess: string;
  signupSuccess: string;
  
  // Settings page
  settings: string;
  settingsDescription: string;
  language: string;
  languageDescription: string;
  documentation: string;
  documentationDescription: string;
  viewDocumentation: string;
  
  // Language names
  turkish: string;
  english: string;
  spanish: string;
  
  // Documentation page
  projectDocumentation: string;
  backToSettings: string;
}

const translations: Record<Language, Translations> = {
  tr: {
    accountPlanning: 'Account Planning',
    accountPlanningDescription: 'Hesap planlaması yönetim sistemi',
    login: 'Giriş Yap',
    signup: 'Kayıt Ol',
    email: 'E-posta',
    password: 'Şifre',
    confirmPassword: 'Şifre Tekrar',
    fullName: 'Ad Soyad',
    loggingIn: 'Giriş yapılıyor...',
    signingUp: 'Kayıt yapılıyor...',
    termsAgreement: 'Devam ederek kullanım şartlarını kabul etmiş olursunuz.',
    fillAllFields: 'Lütfen tüm alanları doldurun',
    passwordsNotMatch: 'Şifreler eşleşmiyor',
    passwordMinLength: 'Şifre en az 6 karakter olmalıdır',
    invalidCredentials: 'Geçersiz e-posta veya şifre',
    emailAlreadyRegistered: 'Bu e-posta adresi zaten kayıtlı',
    loginSuccess: 'Giriş başarılı!',
    signupSuccess: 'Kayıt başarılı! Giriş yapılıyor...',
    settings: 'Ayarlar',
    settingsDescription: 'Uygulama ayarlarını yönetin',
    language: 'Dil',
    languageDescription: 'Uygulama dilini seçin',
    documentation: 'Dokümantasyon',
    documentationDescription: 'Proje README dosyasını görüntüleyin',
    viewDocumentation: 'Dokümantasyonu Görüntüle',
    turkish: 'Türkçe',
    english: 'English',
    spanish: 'Español',
    projectDocumentation: 'Proje Dokümantasyonu',
    backToSettings: 'Ayarlara Dön',
  },
  en: {
    accountPlanning: 'Account Planning',
    accountPlanningDescription: 'Account planning management system',
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    loggingIn: 'Logging in...',
    signingUp: 'Signing up...',
    termsAgreement: 'By continuing, you agree to the terms of use.',
    fillAllFields: 'Please fill in all fields',
    passwordsNotMatch: 'Passwords do not match',
    passwordMinLength: 'Password must be at least 6 characters',
    invalidCredentials: 'Invalid email or password',
    emailAlreadyRegistered: 'This email is already registered',
    loginSuccess: 'Login successful!',
    signupSuccess: 'Registration successful! Logging in...',
    settings: 'Settings',
    settingsDescription: 'Manage application settings',
    language: 'Language',
    languageDescription: 'Select application language',
    documentation: 'Documentation',
    documentationDescription: 'View project README file',
    viewDocumentation: 'View Documentation',
    turkish: 'Türkçe',
    english: 'English',
    spanish: 'Español',
    projectDocumentation: 'Project Documentation',
    backToSettings: 'Back to Settings',
  },
  es: {
    accountPlanning: 'Account Planning',
    accountPlanningDescription: 'Sistema de gestión de planificación de cuentas',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    fullName: 'Nombre Completo',
    loggingIn: 'Iniciando sesión...',
    signingUp: 'Registrando...',
    termsAgreement: 'Al continuar, acepta los términos de uso.',
    fillAllFields: 'Por favor complete todos los campos',
    passwordsNotMatch: 'Las contraseñas no coinciden',
    passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
    invalidCredentials: 'Correo o contraseña inválidos',
    emailAlreadyRegistered: 'Este correo ya está registrado',
    loginSuccess: '¡Inicio de sesión exitoso!',
    signupSuccess: '¡Registro exitoso! Iniciando sesión...',
    settings: 'Configuración',
    settingsDescription: 'Administrar configuración de la aplicación',
    language: 'Idioma',
    languageDescription: 'Seleccionar idioma de la aplicación',
    documentation: 'Documentación',
    documentationDescription: 'Ver archivo README del proyecto',
    viewDocumentation: 'Ver Documentación',
    turkish: 'Türkçe',
    english: 'English',
    spanish: 'Español',
    projectDocumentation: 'Documentación del Proyecto',
    backToSettings: 'Volver a Configuración',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'app-language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (stored as Language) || 'tr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && (stored === 'tr' || stored === 'en' || stored === 'es')) {
      setLanguageState(stored);
    }
  }, []);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
