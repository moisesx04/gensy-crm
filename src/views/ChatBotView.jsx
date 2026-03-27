import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Home, Globe, User, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { addCliente } from '../lib/api';

const STEPS = [
  { key: 'nombreCompleto', t_key: 'bot_q_name', type: 'text' },
  { key: 'numPersonas', t_key: 'bot_q_people', type: 'number' },
  { key: 'numHabitaciones', t_key: 'bot_q_rooms', type: 'number' },
  { key: 'edades', t_key: 'bot_q_ages', type: 'text' },
  { key: 'telefono', t_key: 'bot_q_phone', type: 'text', optional: true },
  { key: 'direccion', t_key: 'bot_q_address', type: 'text', optional: true },
  { key: 'mascotas', t_key: 'bot_q_pets', type: 'options', opts: ['Sí', 'No'] },
  { key: 'tipoIdentificacion', t_key: 'bot_q_id_type', type: 'options', opts: ['Pasaporte', 'ID de NY', 'ID de NJ', 'ID de FL', 'Driver License USA', 'Cédula Dominicana', 'Matrícula Consular', 'Otro'] },
  { key: 'tipoIdOtro', t_key: 'bot_q_id_other', type: 'text', cond: (f) => f.tipoIdentificacion === 'Otro' },
  { key: 'numeroIdentificacion', t_key: 'bot_q_id_num', type: 'text' },
  { key: 'tipoSocial', t_key: 'bot_q_social_type', type: 'options', opts: ['Social Security (SSN)', 'ITIN Number', 'Ninguno'] },
  { key: 'numeroSocial', t_key: 'bot_q_social_num', type: 'text', cond: (f) => f.tipoSocial && f.tipoSocial !== 'Ninguno' },
  { key: 'creditScore', t_key: 'bot_q_credit', type: 'number', optional: true },
  { key: 'cuentaBanco', t_key: 'bot_q_bank', type: 'options', opts: ['Sí', 'No'] },
  { key: 'formaCobro', t_key: 'bot_q_payment', type: 'options', opts: ['Cheque de nómina', 'Depósito directo (ACH)', 'Efectivo (Cash)'] },
  { key: 'presentoTaxes', t_key: 'bot_q_taxes', type: 'options', opts: ['Sí', 'No'] },
  { key: 'montoTaxes', t_key: 'bot_q_taxes_amount', type: 'number', cond: (f) => f.presentoTaxes === 'Sí' },
  { key: 'ingresosMensuales', t_key: 'bot_q_income', type: 'number' },
  { key: 'lugarTrabajo', t_key: 'bot_q_workplace', type: 'text' },
  { key: 'cashOPrograma', t_key: 'bot_q_rent_payment', type: 'options', opts: ['Cash', 'Programas de asistencia', 'Ambos (Cash + Programa)'] },
  { key: 'programaAsistencia', t_key: 'bot_q_program', type: 'options', opts: ['Sección 8 / Voucher', 'CityFHEPS', 'LINC', 'FHEPS', 'SOTA', 'HomeBase', 'Otro'], cond: (f) => ['Programas de asistencia', 'Ambos (Cash + Programa)'].includes(f.cashOPrograma) },
];

export default function ChatBotView() {
  const { t, language, setLanguage } = useLanguage();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => {
    const st = STEPS[0];
    return [{ id: Date.now(), sender: 'bot', t_key: st.t_key, isOpt: st.type === 'options', opts: st.opts }];
  });
  const [stepIdx, setStepIdx] = useState(0);
  const [formData, setFormData] = useState({});
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle advancing to the next logical step that meets conditions
  const getNextValidStep = (currentIdx, data) => {
    let nextIdx = currentIdx + 1;
    while (nextIdx < STEPS.length) {
      if (!STEPS[nextIdx].cond || STEPS[nextIdx].cond(data)) {
        return nextIdx;
      }
      nextIdx++;
    }
    return STEPS.length;
  };



  const handleUserReply = async (text, val) => {
    if (!text.trim() && !val) return;
    const ansText = text.trim() || val;
    const ansVal = val || text.trim();
    
    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: ansText }]);
    setInputVal('');

    const currentStep = STEPS[stepIdx];
    const newFormData = { ...formData, [currentStep.key]: ansVal };
    setFormData(newFormData);

    const nextIdx = getNextValidStep(stepIdx, newFormData);
    setStepIdx(nextIdx);

    if (nextIdx < STEPS.length) {
      // Ask next question
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const st = STEPS[nextIdx];
        setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', t_key: st.t_key, isOpt: st.type === 'options', opts: st.opts }]);
      }, 400);
    } else {
      // Finish
      setIsTyping(true);
      setTimeout(async () => {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', t_key: 'bot_end' }]);
        
        // Save to DB
        try {
          const finalData = {
            ...newFormData,
            numPersonas: Number(newFormData.numPersonas || 0),
            numHabitaciones: Number(newFormData.numHabitaciones || 0),
            creditScore: newFormData.creditScore ? Number(newFormData.creditScore) : null,
            ingresosMensuales: Number(newFormData.ingresosMensuales || 0),
            montoTaxes: newFormData.montoTaxes ? Number(newFormData.montoTaxes) : 0,
          };
          const result = await addCliente(finalData);
          showNotification(t('notif_client_success'), 'success');
          setTimeout(() => {
            navigate('/form/gracias', { state: { formData: { ...finalData, id: result.id } } });
          }, 800);
        } catch (err) {
          console.error(err);
          setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', t_key: 'err_submit' }]);
        }
      }, 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleUserReply(inputVal);
  };

  const currentStepDef = STEPS[stepIdx];

  return (
    <div style={{ 
      height: '100dvh', 
      width: '100%',
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', // More vibrant background
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '20px' // Padding around for PC
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: 450, 
        height: '95%', // Leave a bit of space
        maxHeight: 850, 
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: 24, 
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Decorative background blobs */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ 
        padding: '20px 16px 12px', // Increased top padding
        paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))',
        background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        zIndex: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <button onClick={() => navigate('/login')} style={{ background: 'rgba(241, 245, 249, 0.5)', border: 'none', cursor: 'pointer', color: '#64748b', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{ 
            width: 38, 
            height: 38, 
            borderRadius: 12, 
            background: 'linear-gradient(135deg, #4f46e5, #818cf8)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#fff',
            boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)'
          }}>
            <MessageCircle size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>{t('bot_title')}</h1>
            <p style={{ fontSize: 12, color: '#10b981', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <motion.span 
                animate={{ opacity: [1, 0.5, 1] }} 
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} 
              /> 
              {t('bot_status')}
            </p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, 
            border: '1px solid rgba(226, 232, 240, 0.8)',
            background: 'rgba(255, 255, 255, 0.5)', color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
          }}
        >
          <Globe size={14} /> {language === 'es' ? 'EN' : 'ES'}
        </motion.button>
      </div>

      {/* Chat Area */}
      <div style={{ 
        flex: 1, 
        padding: '24px 16px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 20,
        zIndex: 5,
        scrollbarWidth: 'none'
      }}>
        <AnimatePresence mode="popLayout">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20, scale: 0.9, originX: m.sender === 'user' ? 1 : 0 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                background: m.sender === 'user' 
                  ? 'linear-gradient(135deg, #4f46e5, #6366f1)' 
                  : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: m.sender === 'bot' ? 'blur(10px)' : 'none',
                color: m.sender === 'user' ? '#fff' : '#1e293b',
                padding: '14px 18px',
                borderRadius: 20,
                borderBottomLeftRadius: m.sender === 'bot' ? 4 : 20,
                borderBottomRightRadius: m.sender === 'user' ? 4 : 20,
                boxShadow: m.sender === 'bot' ? '0 8px 32px rgba(31, 38, 135, 0.07)' : '0 4px 12px rgba(79, 70, 229, 0.2)',
                border: m.sender === 'bot' ? '1px solid rgba(255, 255, 255, 0.4)' : 'none',
                fontSize: 15,
                lineHeight: 1.6,
                fontWeight: 600,
                position: 'relative'
              }}>
                {m.t_key ? t(m.t_key) : m.text}
              </div>
              
              {/* Output Quick Replies if this is the latest bot message asking for options */}
              {m.sender === 'bot' && m.isOpt && m.id === messages[messages.length - 1].id && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                  {m.opts.map((opt) => {
                    const translatedOpt = t('val_' + opt, { defaultValue: opt });
                    return (
                      <motion.button
                        key={opt}
                        whileHover={{ scale: 1.05, y: -2, boxShadow: '0 8px 15px rgba(79, 70, 229, 0.15)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleUserReply(translatedOpt, opt)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.8)', 
                          border: '1.5px solid #4f46e5', 
                          color: '#4f46e5',
                          padding: '10px 20px', 
                          borderRadius: 99, 
                          fontSize: 14, 
                          fontWeight: 800, 
                          cursor: 'pointer',
                          backdropFilter: 'blur(4px)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {translatedOpt}
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ 
                alignSelf: 'flex-start', 
                background: 'rgba(255, 255, 255, 0.5)', 
                backdropFilter: 'blur(8px)',
                padding: '14px 22px', 
                borderRadius: 20, 
                borderBottomLeftRadius: 4, 
                boxShadow: '0 4px 15px rgba(0,0,0,0.02)', 
                display: 'flex', 
                gap: 5,
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ 
        padding: '16px 16px', 
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 800, margin: '0 auto', width: '100%' }}>
          {currentStepDef?.optional && currentStepDef?.type !== 'options' && (
            <button 
              onClick={() => handleUserReply(t('bot_opt_skip'), '')}
              style={{ 
                background: 'rgba(241, 245, 249, 0.7)', 
                border: 'none', 
                padding: '12px 14px', 
                borderRadius: 14, 
                color: '#475569', 
                fontWeight: 800, 
                cursor: 'pointer', 
                fontSize: 12,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {t('bot_opt_skip')}
            </button>
          )}
          <input 
            type={currentStepDef?.type === 'number' ? 'number' : 'text'}
            placeholder={t('chat_placeholder') || (language === 'es' ? "Escribe tu respuesta..." : "Type your answer...")} 
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={currentStepDef?.type === 'options' || stepIdx >= STEPS.length}
            style={{
              flex: 1, 
              padding: '14px 18px', 
              borderRadius: 18, 
              border: '2px solid rgba(226, 232, 240, 0.8)', 
              background: 'rgba(255, 255, 255, 0.5)',
              fontSize: 16, 
              outline: 'none', 
              color: '#1e293b',
              fontWeight: 600,
              minWidth: 0,
              transition: 'border-color 0.2s'
            }}
          />
          <motion.button 
            whileHover={{ scale: inputVal.trim() ? 1.05 : 1 }}
            whileTap={{ scale: inputVal.trim() ? 0.95 : 1 }}
            onClick={() => handleUserReply(inputVal)}
            disabled={!inputVal.trim() || currentStepDef?.type === 'options' || stepIdx >= STEPS.length}
            style={{
              width: 50, 
              height: 50, 
              borderRadius: 16, 
              background: (!inputVal.trim() || currentStepDef?.type === 'options') ? '#e2e8f0' : 'linear-gradient(135deg, #4f46e5, #6366f1)', 
              color: '#fff', 
              border: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              flexShrink: 0,
              transition: 'all 0.2s',
              boxShadow: inputVal.trim() ? '0 8px 16px rgba(79, 70, 229, 0.25)' : 'none'
            }}
          >
            <Send size={18} />
          </motion.button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {t('sys_footer')} <span style={{ color: '#4f46e5' }}>{t('brand_name')}</span>
        </p>
      </div>

      <style>{`
        .dot { width: 7px; height: 7px; background: #94a3b8; border-radius: 50%; display: inline-block; animation: bounce 1.4s infinite ease-in-out both; }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0.3); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }
        
        /* Hide scrollbar but keep functionality */
        ::-webkit-scrollbar { display: none; }
      `}</style>
      </div>
    </div>
  );
}
