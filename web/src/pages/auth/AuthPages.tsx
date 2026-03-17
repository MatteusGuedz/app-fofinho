import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { log } from '../../lib/logger';
import { easings } from '../../components/ui/Motion';

/* ── Floating petal particles ───────────────────────────── */
type Particle = { id: number; x: number; dur: number; delay: number; symbol: string; size: number };
const SYMBOLS = ['', '', '', '', '', ''];

function useParticles(count = 14) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    setParticles(Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      dur: 6 + Math.random() * 8,
      delay: Math.random() * 5,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      size: 0.6 + Math.random() * 0.6,
    })));
    
    const id = setInterval(() => {
      setParticles(p => [...p.slice(-22), {
        id: Date.now(),
        x: Math.random() * 100,
        dur: 6 + Math.random() * 8,
        delay: 0,
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        size: 0.6 + Math.random() * 0.6,
      }]);
    }, 1800);
    
    return () => clearInterval(id);
  }, [count]);
  
  return particles;
}

/* ── Animation variants ─────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easings.smooth } }
};

const boxVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.8, ease: easings.smooth, delay: 0.2 }
  }
};

/* ── Landing Page ────────────────────────────────────────── */
export function LandingPage() {
  const navigate = useNavigate();
  const particles = useParticles(16);

  const features = [
    { icon: 'check', text: 'Checklist completo do casamento' },
    { icon: 'users', text: 'Gestao de convidados + RSVP' },
    { icon: 'wallet', text: 'Orcamento em 3 faixas de preco' },
    { icon: 'image', text: 'Moodboard com imagens' },
    { icon: 'layout', text: 'Designer visual do espaco' },
    { icon: 'file', text: 'Relatorio A4 para imprimir' },
  ];

  const featureIcons: Record<string, JSX.Element> = {
    check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    wallet: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
    image: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    layout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
    file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  };

  return (
    <div className="auth-screen">
      {/* Background particles */}
      <div id="particle-layer" aria-hidden="true">
        <AnimatePresence>
          {particles.map(p => (
            <motion.span
              key={p.id}
              className="petal"
              initial={{ opacity: 0, y: -30, rotate: 0 }}
              animate={{ 
                opacity: [0, 0.6, 0.6, 0],
                y: ['0vh', '105vh'],
                rotate: [0, 540]
              }}
              transition={{ 
                duration: p.dur, 
                delay: p.delay,
                ease: 'linear'
              }}
              style={{ 
                left: `${p.x}%`, 
                fontSize: `${p.size}rem`,
              }}
            >
              {p.symbol}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Background text */}
      <motion.div 
        className="auth-bg-text" 
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      >
        Amor
      </motion.div>

      {/* Main box */}
      <motion.div 
        className="auth-box"
        variants={boxVariants}
        initial="hidden"
        animate="visible"
        style={{ textAlign: 'center' }}
      >
        {/* Rings */}
        <motion.div 
          className="auth-rings"
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#c9a55a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 20px rgba(201, 165, 90, 0.5))' }}>
            <circle cx="9" cy="12" r="5"/>
            <circle cx="15" cy="12" r="5"/>
          </svg>
        </motion.div>

        <motion.div 
          className="auth-title"
          variants={itemVariants}
        >
          Wedding Fofinho
        </motion.div>
        
        <motion.div 
          className="auth-sub"
          variants={itemVariants}
        >
          O seu planejamento romantico
        </motion.div>

        {/* Features */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gap: 10, margin: '24px 0', textAlign: 'left' }}
        >
          {features.map((f, i) => (
            <motion.div 
              key={f.icon}
              variants={itemVariants}
              custom={i}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                fontSize: '.85rem', 
                color: 'rgba(255,255,255,.7)',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
              whileHover={{ 
                x: 4, 
                background: 'rgba(255,255,255,0.06)',
                transition: { duration: 0.2 }
              }}
            >
              <span style={{ color: 'rgba(201,165,90,0.8)', flexShrink: 0 }}>
                {featureIcons[f.icon]}
              </span>
              <span>{f.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div 
          style={{ display: 'grid', gap: 12 }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.button 
            type="button" 
            className="auth-btn" 
            onClick={() => navigate('/signup')}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            Comecar meu casamento
          </motion.button>
          
          <motion.button
            type="button"
            onClick={() => navigate('/login')}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              background: 'rgba(255,255,255,.05)', 
              border: '1px solid rgba(201,165,90,.25)', 
              borderRadius: '12px', 
              padding: '14px', 
              color: 'rgba(255,255,255,.7)', 
              fontSize: '.85rem', 
              cursor: 'pointer', 
              fontFamily: 'var(--font-sans)', 
              transition: 'all .2s',
            }}
          >
            Ja tenho conta - Entrar
          </motion.button>
        </motion.div>

        <motion.div 
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Dados salvos no Supabase
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── Login Page ─────────────────────────────────────────── */
export function LoginPage() {
  const { signInWithEmail } = useAuth();
  const { toastError, toastSuccess } = useUi();
  const navigate = useNavigate();
  const particles = useParticles(12);
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const onSubmit = async () => {
    if (!email.includes('@')) return toastError('Digite um email valido.');
    if (password.length < 6) return toastError('Senha com pelo menos 6 caracteres.');
    setLoading(true);
    try {
      log('auth.login', 'info', 'attempt', { email });
      await signInWithEmail(email, password);
      toastSuccess('Bem-vindo(a) de volta!');
      navigate('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao entrar.';
      log('auth.login', 'error', msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div id="particle-layer" aria-hidden="true">
        <AnimatePresence>
          {particles.map(p => (
            <motion.span
              key={p.id}
              className="petal"
              initial={{ opacity: 0, y: -30, rotate: 0 }}
              animate={{ 
                opacity: [0, 0.6, 0.6, 0],
                y: ['0vh', '105vh'],
                rotate: [0, 540]
              }}
              transition={{ duration: p.dur, delay: p.delay, ease: 'linear' }}
              style={{ left: `${p.x}%`, fontSize: `${p.size}rem` }}
            >
              {p.symbol}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      
      <motion.div 
        className="auth-bg-text" 
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      >
        Amor
      </motion.div>

      <motion.div 
        className="auth-box"
        variants={boxVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="auth-rings"
          animate={{ rotate: [-8, 8, -8], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#c9a55a" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 20px rgba(201, 165, 90, 0.5))' }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </motion.div>
        
        <motion.div className="auth-title" variants={itemVariants}>Entrar</motion.div>
        <motion.div className="auth-sub" variants={itemVariants}>Acesse seu planejamento</motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="auth-field" variants={itemVariants}>
            <label htmlFor="email">Email</label>
            <input 
              ref={emailRef} 
              id="email" 
              type="email" 
              value={email} 
              placeholder="voce@exemplo.com" 
              autoComplete="email"
              onChange={e => setEmail(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && onSubmit()} 
            />
          </motion.div>
          
          <motion.div className="auth-field" variants={itemVariants} style={{ position: 'relative' }}>
            <label htmlFor="password">Senha</label>
            <input 
              id="password" 
              type={showPass ? 'text' : 'password'} 
              value={password} 
              placeholder="********" 
              autoComplete="current-password"
              onChange={e => setPassword(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && onSubmit()} 
              style={{ paddingRight: 48 }} 
            />
            <button 
              type="button" 
              onClick={() => setShowPass(v => !v)}
              style={{ 
                position: 'absolute', 
                right: 14, 
                bottom: 12, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'rgba(255,255,255,.4)', 
                fontSize: '.9rem',
                padding: 4,
              }}
            >
              {showPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </motion.div>

          <motion.button 
            type="button" 
            className="auth-btn" 
            onClick={onSubmit} 
            disabled={loading}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <motion.span 
                  className="btn-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                />
                Entrando...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                Entrar
              </>
            )}
          </motion.button>
        </motion.div>

        <motion.div 
          className="auth-footer" 
          style={{ marginTop: 18 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Nao tem conta?{' '}
          <button type="button" className="auth-link" onClick={() => navigate('/signup')}>Criar agora</button>
          {' - '}
          <button type="button" className="auth-link" onClick={() => navigate('/')}>Voltar</button>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── Sign Up Page ────────────────────────────────────────── */
export function SignUpPage() {
  const { signUpWithEmail } = useAuth();
  const { toastError, toastSuccess } = useUi();
  const navigate = useNavigate();
  const particles = useParticles(12);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pass2, setPass2] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = password.length >= 10 ? 'forte' : password.length >= 6 ? 'media' : password.length > 0 ? 'fraca' : '';
  const strengthColor = strength === 'forte' ? '#22c55e' : strength === 'media' ? '#c9a55a' : '#ef4444';
  const strengthPct = strength === 'forte' ? 100 : strength === 'media' ? 65 : strength === 'fraca' ? 30 : 0;

  const onSubmit = async () => {
    if (!email.includes('@')) return toastError('Email invalido.');
    if (password.length < 6) return toastError('Senha com pelo menos 6 caracteres.');
    if (password !== pass2) return toastError('As senhas nao conferem.');
    setLoading(true);
    try {
      log('auth.signup', 'info', 'attempt', { email });
      await signUpWithEmail(email, password);
      toastSuccess('Conta criada! Faca login para comecar');
      navigate('/login');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao cadastrar.';
      log('auth.signup', 'error', msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div id="particle-layer" aria-hidden="true">
        <AnimatePresence>
          {particles.map(p => (
            <motion.span
              key={p.id}
              className="petal"
              initial={{ opacity: 0, y: -30, rotate: 0 }}
              animate={{ 
                opacity: [0, 0.6, 0.6, 0],
                y: ['0vh', '105vh'],
                rotate: [0, 540]
              }}
              transition={{ duration: p.dur, delay: p.delay, ease: 'linear' }}
              style={{ left: `${p.x}%`, fontSize: `${p.size}rem` }}
            >
              {p.symbol}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      
      <motion.div 
        className="auth-bg-text" 
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      >
        Juntos
      </motion.div>

      <motion.div 
        className="auth-box"
        variants={boxVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="auth-rings"
          animate={{ rotate: [-8, 8, -8], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#c9a55a" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 4px 20px rgba(201, 165, 90, 0.5))' }}>
            <circle cx="9" cy="12" r="5"/>
            <circle cx="15" cy="12" r="5"/>
          </svg>
        </motion.div>
        
        <motion.div className="auth-title" variants={itemVariants}>Criar conta</motion.div>
        <motion.div className="auth-sub" variants={itemVariants}>Comece seu planejamento a dois</motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="auth-field" variants={itemVariants}>
            <label htmlFor="su-email">Email</label>
            <input 
              id="su-email" 
              type="email" 
              value={email} 
              placeholder="voce@exemplo.com" 
              autoComplete="email"
              onChange={e => setEmail(e.target.value)} 
            />
          </motion.div>
          
          <motion.div className="auth-field" variants={itemVariants}>
            <label htmlFor="su-pass">Senha</label>
            <input 
              id="su-pass" 
              type="password" 
              value={password} 
              placeholder="minimo 6 caracteres" 
              autoComplete="new-password"
              onChange={e => setPassword(e.target.value)} 
            />
            <AnimatePresence>
              {password.length > 0 && (
                <motion.div 
                  style={{ marginTop: 8 }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
                    <motion.div 
                      style={{ height: '100%', background: strengthColor, borderRadius: 3 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${strengthPct}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div style={{ fontSize: '.65rem', color: strengthColor, marginTop: 4 }}>Forca: {strength}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <motion.div className="auth-field" variants={itemVariants}>
            <label htmlFor="su-pass2">Confirmar senha</label>
            <input 
              id="su-pass2" 
              type="password" 
              value={pass2} 
              placeholder="repita a senha" 
              autoComplete="new-password"
              onChange={e => setPass2(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && onSubmit()} 
            />
            <AnimatePresence>
              {pass2.length > 0 && password !== pass2 && (
                <motion.div 
                  style={{ fontSize: '.7rem', color: '#ef4444', marginTop: 4 }}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  As senhas nao conferem
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.button 
            type="button" 
            className="auth-btn" 
            onClick={onSubmit} 
            disabled={loading}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <motion.span 
                  className="btn-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                />
                Criando...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                Criar conta
              </>
            )}
          </motion.button>
        </motion.div>

        <motion.div 
          className="auth-footer" 
          style={{ marginTop: 18 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Ja tem conta?{' '}
          <button type="button" className="auth-link" onClick={() => navigate('/login')}>Entrar</button>
          {' - '}
          <button type="button" className="auth-link" onClick={() => navigate('/')}>Voltar</button>
        </motion.div>
      </motion.div>
    </div>
  );
}
