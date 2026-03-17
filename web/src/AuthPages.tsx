import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { log } from '../../lib/logger';

/* ── Petal particle types ────────────────────────────────── */
type P = {
  id: number;
  x: number;
  dur: number;
  delay: number;
  size: number;
  type: 'heart' | 'diamond' | 'circle';
  color: string;
};

const PETAL_COLORS = [
  'rgba(201,120,130,.45)',
  'rgba(201,165,90,.35)',
  'rgba(154,170,144,.4)',
  'rgba(233,176,184,.5)',
];

function PetalShape({ type, size, color }: { type: P['type']; size: number; color: string }) {
  if (type === 'heart') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 18" fill={color}>
        <path d="M10 16S2 10.5 2 5.5C2 3 4 1 6.5 1c1.5 0 2.8.8 3.5 2C10.7 1.8 12 1 13.5 1 16 1 18 3 18 5.5 18 10.5 10 16 10 16z"/>
      </svg>
    );
  }
  if (type === 'diamond') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" fill={color}>
        <polygon points="7,1 13,7 7,13 1,7"/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="6" fill={color}/>
    </svg>
  );
}

function useParticles(count = 12) {
  const [particles, setParticles] = useState<P[]>([]);
  const types: P['type'][] = ['heart', 'diamond', 'circle'];
  useEffect(() => {
    setParticles(Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      dur: 6 + Math.random() * 8,
      delay: Math.random() * 6,
      size: 6 + Math.random() * 9,
      type: types[Math.floor(Math.random() * types.length)],
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    })));
    const id = setInterval(() => {
      setParticles(p => [...p.slice(-22), {
        id: Date.now(),
        x: Math.random() * 100,
        dur: 6 + Math.random() * 8,
        delay: 0,
        size: 6 + Math.random() * 9,
        type: types[Math.floor(Math.random() * types.length)],
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      }]);
    }, 1600);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  return particles;
}

/* ── SVG Icons ──────────────────────────────────────────── */
const RingsIcon = ({ size = 52 }: { size?: number }) => (
  <svg width={size} height={Math.round(size * 0.7)} viewBox="0 0 52 36" fill="none">
    <circle cx="17" cy="18" r="12" stroke="rgba(201,165,90,.8)" strokeWidth="2.2" fill="none"/>
    <circle cx="35" cy="18" r="12" stroke="rgba(233,176,184,.7)" strokeWidth="2.2" fill="none"/>
    <path d="M26 10.5Q28 18 26 25.5" stroke="rgba(201,165,90,.3)" strokeWidth="1" fill="none"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(201,120,130,.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const CheckSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,165,90,.6)" strokeWidth="2" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

/* Decorative SVG corner flourish */
function CornerFlourishTL() {
  return (
    <svg
      style={{ position: 'absolute', top: 12, left: 12, opacity: .25, pointerEvents: 'none' }}
      width="44" height="44" viewBox="0 0 44 44" fill="none"
    >
      <path d="M2 42V10Q2 2 10 2H42" stroke="rgba(201,165,90,.8)" strokeWidth="1"/>
      <circle cx="6" cy="6" r="2" fill="rgba(201,165,90,.5)"/>
    </svg>
  );
}
function CornerFlourishBR() {
  return (
    <svg
      style={{ position: 'absolute', bottom: 12, right: 12, opacity: .25, pointerEvents: 'none' }}
      width="44" height="44" viewBox="0 0 44 44" fill="none"
    >
      <path d="M42 2V34Q42 42 34 42H2" stroke="rgba(201,165,90,.8)" strokeWidth="1"/>
      <circle cx="38" cy="38" r="2" fill="rgba(201,165,90,.5)"/>
    </svg>
  );
}

/* ── Landing Page ────────────────────────────────────────── */
export function LandingPage() {
  const navigate = useNavigate();
  const particles = useParticles(16);

  const features = [
    { label: 'Checklist completo do casamento' },
    { label: 'Gestão de convidados + RSVP' },
    { label: 'Orçamento em 3 faixas de preço' },
    { label: 'Moodboard com imagens' },
    { label: 'Designer visual do espaço' },
    { label: 'Relatório A4 para imprimir' },
  ];

  return (
    <div className="auth-screen">
      {/* Background petals */}
      <div id="particle-layer" aria-hidden="true">
        {particles.map(p => (
          <span
            key={p.id}
            className="petal"
            style={{
              left: `${p.x}%`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            <PetalShape type={p.type} size={p.size} color={p.color} />
          </span>
        ))}
      </div>

      <div className="auth-bg-text" aria-hidden="true">Amor</div>

      <div className="auth-box" style={{ textAlign: 'center' }}>
        <CornerFlourishTL />
        <CornerFlourishBR />

        <div className="auth-rings">
          <RingsIcon size={56} />
        </div>

        <div className="auth-title">Wedding Fofinho</div>
        <div className="auth-sub">O seu planejamento romântico</div>

        {/* Features list */}
        <div style={{
          display: 'grid',
          gap: 9,
          margin: '20px 0 24px',
          textAlign: 'left',
        }}>
          {features.map(f => (
            <div key={f.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '.78rem',
              color: 'rgba(255,255,255,.55)',
              fontWeight: 300,
            }}>
              <span style={{ flexShrink: 0 }}><CheckSmall /></span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 18,
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(201,165,90,.15)' }}/>
          <HeartIcon />
          <div style={{ flex: 1, height: '1px', background: 'rgba(201,165,90,.15)' }}/>
        </div>

        {/* CTAs */}
        <div style={{ display: 'grid', gap: 10 }}>
          <button type="button" className="auth-btn" onClick={() => navigate('/signup')}>
            Começar meu casamento
          </button>
          <button
            type="button"
            style={{
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(201,165,90,.15)',
              borderRadius: '12px',
              padding: '12px',
              color: 'rgba(255,255,255,.45)',
              fontSize: '.74rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 400,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              transition: 'all .18s',
            }}
            onClick={() => navigate('/login')}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.background = 'rgba(255,255,255,.07)';
              (e.target as HTMLElement).style.color = 'rgba(255,255,255,.65)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.background = 'rgba(255,255,255,.04)';
              (e.target as HTMLElement).style.color = 'rgba(255,255,255,.45)';
            }}
          >
            Já tenho conta — Entrar
          </button>
        </div>

        <div className="auth-footer" style={{ marginTop: 20 }}>
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
        {particles.map(p => (
          <span key={p.id} className="petal" style={{
            left: `${p.x}%`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}>
            <PetalShape type={p.type} size={p.size} color={p.color} />
          </span>
        ))}
      </div>
      <div className="auth-bg-text" aria-hidden="true">Amor</div>

      <div className="auth-box">
        <CornerFlourishTL />
        <CornerFlourishBR />

        <div className="auth-rings">
          <svg width="42" height="30" viewBox="0 0 42 30" fill="none">
            <path d="M21 5 Q28 15 21 25" stroke="rgba(201,165,90,.4)" strokeWidth="1" fill="none"/>
            <circle cx="13" cy="15" r="10" stroke="rgba(201,165,90,.8)" strokeWidth="2" fill="none"/>
            <circle cx="29" cy="15" r="10" stroke="rgba(201,120,130,.6)" strokeWidth="2" fill="none"/>
          </svg>
        </div>

        <div className="auth-title">Entrar</div>
        <div className="auth-sub">Acesse seu planejamento</div>

        <div className="auth-field">
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
        </div>

        <div className="auth-field" style={{ position: 'relative' }}>
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type={showPass ? 'text' : 'password'}
            value={password}
            placeholder="••••••••"
            autoComplete="current-password"
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
            style={{ paddingRight: 46 }}
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            style={{
              position: 'absolute',
              right: 14,
              bottom: 11,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,.3)',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
              transition: 'color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(201,165,90,.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.3)')}
          >
            <EyeIcon open={showPass} />
          </button>
        </div>

        <button type="button" className="auth-btn" onClick={onSubmit} disabled={loading}>
          {loading ? (
            <><span className="btn-spinner" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }}/> Entrando…</>
          ) : (
            'Entrar'
          )}
        </button>

        <div className="auth-footer" style={{ marginTop: 16 }}>
          Não tem conta?{' '}
          <button type="button" className="auth-link" onClick={() => navigate('/signup')}>
            Criar agora
          </button>
          {' · '}
          <button type="button" className="auth-link" onClick={() => navigate('/')}>
            Voltar
          </button>
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

  const strength =
    password.length >= 10 ? 'forte' :
    password.length >= 6  ? 'média' :
    password.length > 0   ? 'fraca' : '';
  const strengthColor =
    strength === 'forte' ? 'rgba(86,184,94,.9)' :
    strength === 'média' ? 'rgba(201,165,90,.9)' :
    'rgba(192,57,43,.9)';
  const strengthPct =
    strength === 'forte' ? 100 :
    strength === 'média' ? 60 :
    strength === 'fraca' ? 28 : 0;

  const onSubmit = async () => {
    if (!email.includes('@'))  return toastError('Email inválido.');
    if (password.length < 6)   return toastError('Senha com pelo menos 6 caracteres.');
    if (password !== pass2)    return toastError('As senhas não conferem.');
    setLoading(true);
    try {
      log('auth.signup', 'info', 'attempt', { email });
      await signUpWithEmail(email, password);
      toastSuccess('Conta criada! Faça login para começar');
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
          <span key={p.id} className="petal" style={{
            left: `${p.x}%`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}>
            <PetalShape type={p.type} size={p.size} color={p.color} />
          </span>
        ))}
      </div>
      <div className="auth-bg-text" aria-hidden="true">Juntos</div>

      <div className="auth-box">
        <CornerFlourishTL />
        <CornerFlourishBR />

        <div className="auth-rings">
          <RingsIcon size={52} />
        </div>
        <div className="auth-title">Criar conta</div>
        <div className="auth-sub">Comece o planejamento a dois</div>

        <div className="auth-field">
          <label htmlFor="su-email">Email</label>
          <input
            id="su-email"
            type="email"
            value={email}
            placeholder="voce@exemplo.com"
            autoComplete="email"
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="su-pass">Senha</label>
          <input
            id="su-pass"
            type="password"
            value={password}
            placeholder="mínimo 6 caracteres"
            autoComplete="new-password"
            onChange={e => setPassword(e.target.value)}
          />
          {password.length > 0 && (
            <div style={{ marginTop: 7 }}>
              <div style={{
                height: 3,
                borderRadius: 2,
                background: 'rgba(255,255,255,.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${strengthPct}%`,
                  height: '100%',
                  background: strengthColor,
                  borderRadius: 2,
                  transition: 'all .3s',
                }}/>
              </div>
              <div style={{ fontSize: '.6rem', color: strengthColor, marginTop: 4, letterSpacing: '.04em' }}>
                Força da senha: {strength}
              </div>
            </div>
          )}
        </div>

        <div className="auth-field">
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
          {pass2.length > 0 && password !== pass2 && (
            <div style={{ fontSize: '.62rem', color: 'rgba(192,57,43,.9)', marginTop: 4 }}>
              As senhas não conferem
            </div>
          )}
        </div>

        <button type="button" className="auth-btn" onClick={onSubmit} disabled={loading}>
          {loading ? (
            <><span className="btn-spinner" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }}/> Criando…</>
          ) : (
            'Criar conta'
          )}
        </button>

        <div className="auth-footer" style={{ marginTop: 16 }}>
          Já tem conta?{' '}
          <button type="button" className="auth-link" onClick={() => navigate('/login')}>
            Entrar
          </button>
          {' · '}
          <button type="button" className="auth-link" onClick={() => navigate('/')}>
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
