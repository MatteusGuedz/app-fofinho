import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { log } from '../../lib/logger';

/* ── Floating petal / sparkle particles ─────────────────── */
type P = { id: number; x: number; dur: number; delay: number; emoji: string; size: number };
const EMOJIS = ['🌸','✨','💮','🪷','🌹','💫','⭐','🌺'];

function useParticles(count = 12) {
  const [particles, setParticles] = useState<P[]>([]);
  useEffect(() => {
    setParticles(Array.from({ length: count }, (_, i) => ({
      id: i, x: Math.random() * 100,
      dur: 5 + Math.random() * 7,
      delay: Math.random() * 5,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      size: .6 + Math.random() * .8,
    })));
    const id = setInterval(() => {
      setParticles(p => [...p.slice(-20), {
        id: Date.now(), x: Math.random() * 100,
        dur: 5 + Math.random() * 7,
        delay: 0,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        size: .6 + Math.random() * .8,
      }]);
    }, 1500);
    return () => clearInterval(id);
  }, [count]);
  return particles;
}

/* ── Landing Page ────────────────────────────────────────── */
export function LandingPage() {
  const navigate = useNavigate();
  const particles = useParticles(14);
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className="auth-screen" style={{ background: 'linear-gradient(135deg, #1a0a0e 0%, #2e1218 40%, #1a0a20 100%)' }}>
      {/* Background particles */}
      <div id="particle-layer" aria-hidden="true">
        {particles.map(p => (
          <span key={p.id} className="petal" style={{ left: `${p.x}%`, fontSize: `${p.size}rem`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}>
            {p.emoji}
          </span>
        ))}
      </div>

      {/* Background text */}
      <div className="auth-bg-text" aria-hidden="true">Amor</div>

      {/* Main box */}
      <div className={`auth-box${visible ? '' : ''}`} style={{ textAlign: 'center' }}>
        {/* Rings */}
        <div className="auth-rings">
          <span className="auth-ring-a">💍</span>
          <span>+</span>
          <span className="auth-ring-b">💍</span>
        </div>

        <div className="auth-title">Wedding Fofinho</div>
        <div className="auth-sub">O seu planejamento romântico</div>

        {/* Features */}
        <div style={{ display: 'grid', gap: 8, margin: '20px 0', textAlign: 'left' }}>
          {[
            { icon: '✅', text: 'Checklist completo do casamento' },
            { icon: '👥', text: 'Gestão de convidados + RSVP' },
            { icon: '💰', text: 'Orçamento em 3 faixas de preço' },
            { icon: '🖼️', text: 'Moodboard com imagens' },
            { icon: '🏛️', text: 'Designer visual do espaço' },
            { icon: '📊', text: 'Relatório A4 para imprimir' },
          ].map(f => (
            <div key={f.icon} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.8rem', color: 'rgba(255,255,255,.65)' }}>
              <span style={{ fontSize: '1rem' }}>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'grid', gap: 10 }}>
          <button type="button" className="auth-btn" onClick={() => navigate('/signup')}>
            ✨ Começar meu casamento
          </button>
          <button
            type="button"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(232,180,184,.2)', borderRadius: 'var(--r-sm)', padding: '11px', color: 'rgba(255,255,255,.6)', fontSize: '.84rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all .18s' }}
            onClick={() => navigate('/login')}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(232,180,184,.08)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,.06)'; }}
          >
            Já tenho conta → Entrar
          </button>
        </div>

        <div className="auth-footer">
          Dados salvos no Supabase · Só configurar o .env
        </div>
      </div>
    </div>
  );
}

/* ── Login Page ─────────────────────────────────────────── */
export function LoginPage() {
  const { signInWithEmail } = useAuth();
  const { toastError, toastSuccess } = useUi();
  const navigate = useNavigate();
  const particles = useParticles(10);
  const emailRef = useRef<HTMLInputElement>(null);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const onSubmit = async () => {
    if (!email.includes('@')) return toastError('Digite um email válido.');
    if (password.length < 6)   return toastError('Senha com pelo menos 6 caracteres.');
    setLoading(true);
    try {
      log('auth.login', 'info', 'attempt', { email });
      await signInWithEmail(email, password);
      toastSuccess('Bem-vindo(a) de volta! 💕');
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
        {particles.map(p => (
          <span key={p.id} className="petal" style={{ left: `${p.x}%`, fontSize: `${p.size}rem`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}>{p.emoji}</span>
        ))}
      </div>
      <div className="auth-bg-text" aria-hidden="true">Amor</div>

      <div className="auth-box">
        <div className="auth-rings">
          <span className="auth-ring-a">💒</span>
        </div>
        <div className="auth-title">Entrar</div>
        <div className="auth-sub">Acesse seu planejamento</div>

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input ref={emailRef} id="email" type="email" value={email} placeholder="voce@exemplo.com" autoComplete="email"
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSubmit()} />
        </div>
        <div className="auth-field" style={{ position: 'relative' }}>
          <label htmlFor="password">Senha</label>
          <input id="password" type={showPass ? 'text' : 'password'} value={password} placeholder="••••••••" autoComplete="current-password"
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSubmit()} style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPass(v => !v)}
            style={{ position: 'absolute', right: 12, bottom: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: '.85rem', fontFamily: 'var(--font-sans)' }}>
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>

        <button type="button" className="auth-btn" onClick={onSubmit} disabled={loading}>
          {loading ? (
            <><span className="btn-spinner" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }}/> Entrando…</>
          ) : '💕 Entrar'}
        </button>

        <div className="auth-footer" style={{ marginTop: 14 }}>
          Não tem conta?{' '}
          <button type="button" className="auth-link" onClick={() => navigate('/signup')}>Criar agora</button>
          {' · '}
          <button type="button" className="auth-link" onClick={() => navigate('/')}>Voltar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Sign Up Page ────────────────────────────────────────── */
export function SignUpPage() {
  const { signUpWithEmail } = useAuth();
  const { toastError, toastSuccess } = useUi();
  const navigate = useNavigate();
  const particles = useParticles(10);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [pass2,    setPass2]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const strength = password.length >= 10 ? 'forte' : password.length >= 6 ? 'média' : password.length > 0 ? 'fraca' : '';
  const strengthColor = strength === 'forte' ? '#4caf50' : strength === 'média' ? '#c9a84c' : '#e53935';
  const strengthPct   = strength === 'forte' ? 100 : strength === 'média' ? 65 : strength === 'fraca' ? 30 : 0;

  const onSubmit = async () => {
    if (!email.includes('@'))     return toastError('Email inválido.');
    if (password.length < 6)      return toastError('Senha com pelo menos 6 caracteres.');
    if (password !== pass2)       return toastError('As senhas não conferem.');
    setLoading(true);
    try {
      log('auth.signup', 'info', 'attempt', { email });
      await signUpWithEmail(email, password);
      toastSuccess('Conta criada! Faça login para começar 💕');
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
        {particles.map(p => (
          <span key={p.id} className="petal" style={{ left: `${p.x}%`, fontSize: `${p.size}rem`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}>{p.emoji}</span>
        ))}
      </div>
      <div className="auth-bg-text" aria-hidden="true">Juntos</div>

      <div className="auth-box">
        <div className="auth-rings">
          <span className="auth-ring-a">💍</span>
          <span className="auth-ring-b">💍</span>
        </div>
        <div className="auth-title">Criar conta</div>
        <div className="auth-sub">Comece seu planejamento a dois</div>

        <div className="auth-field">
          <label htmlFor="su-email">Email</label>
          <input id="su-email" type="email" value={email} placeholder="voce@exemplo.com" autoComplete="email"
            onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="auth-field">
          <label htmlFor="su-pass">Senha</label>
          <input id="su-pass" type="password" value={password} placeholder="mínimo 6 caracteres" autoComplete="new-password"
            onChange={e => setPassword(e.target.value)} />
          {password.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
                <div style={{ width: `${strengthPct}%`, height: '100%', background: strengthColor, borderRadius: 2, transition: 'all .3s' }}/>
              </div>
              <div style={{ fontSize: '.62rem', color: strengthColor, marginTop: 3 }}>Força: {strength}</div>
            </div>
          )}
        </div>
        <div className="auth-field">
          <label htmlFor="su-pass2">Confirmar senha</label>
          <input id="su-pass2" type="password" value={pass2} placeholder="repita a senha" autoComplete="new-password"
            onChange={e => setPass2(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSubmit()} />
          {pass2.length > 0 && password !== pass2 && (
            <div style={{ fontSize: '.65rem', color: '#f48', marginTop: 3 }}>As senhas não conferem</div>
          )}
        </div>

        <button type="button" className="auth-btn" onClick={onSubmit} disabled={loading}>
          {loading ? <><span className="btn-spinner" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }}/> Criando…</> : '✨ Criar conta'}
        </button>

        <div className="auth-footer" style={{ marginTop: 14 }}>
          Já tem conta?{' '}
          <button type="button" className="auth-link" onClick={() => navigate('/login')}>Entrar</button>
          {' · '}
          <button type="button" className="auth-link" onClick={() => navigate('/')}>Voltar</button>
        </div>
      </div>
    </div>
  );
}
