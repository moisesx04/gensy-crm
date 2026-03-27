import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../lib/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_lang') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('app_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key, params = {}) => {
    let str = translations[language]?.[key] || translations['es']?.[key] || params.defaultValue || key;
    
    // Replace parameters like {step}
    if (Object.keys(params).length > 0) {
      Object.keys(params).forEach(p => {
        if (p !== 'defaultValue') {
          str = str.replace(new RegExp(`{${p}}`, 'g'), params[p]);
        }
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
