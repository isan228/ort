import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Получаем сохраненный язык из localStorage или используем русский по умолчанию
    return localStorage.getItem('language') || 'ru';
  });

  const [translations, setTranslations] = useState({});

  useEffect(() => {
    // Загружаем переводы для выбранного языка
    const loadTranslations = async () => {
      try {
        const translationsModule = await import(`../locales/${language}.js`);
        setTranslations(translationsModule.default);
      } catch (error) {
        console.error('Error loading translations:', error);
        // Если не удалось загрузить, загружаем русский
        const ruTranslations = await import('../locales/ru.js');
        setTranslations(ruTranslations.default);
      }
    };

    loadTranslations();
  }, [language]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key) => {
    // Поддержка вложенных ключей типа 'common.login'
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Возвращаем ключ, если перевод не найден
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

