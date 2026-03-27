import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, PlusSquare, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function IOSInstallPrompt() {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Detect if device is iOS and not already in standalone mode
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true;
    
    // Also check if they already dismissed it this session
    const dismissed = sessionStorage.getItem('ios_prompt_dismissed');

    if (isIos && !isStandalone && !dismissed) {
      // Show after a short delay
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('ios_prompt_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            right: 20,
            zIndex: 9999,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 24,
            padding: '20px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            maxWidth: 500,
            margin: '0 auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #4f46e5, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <PlusSquare size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1e293b' }}>{t('ios_install_title')}</h3>
            </div>
            <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              {t('ios_install_step1', { icon: <Share size={18} style={{ color: '#007aff' }} /> })}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              {t('ios_install_step2')}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            style={{
              marginTop: 20,
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              background: '#1e293b',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {t('ios_install_btn')}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
