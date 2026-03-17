import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { log } from '../../lib/logger';

export function LoginPage() {
  const { signInWithEmail } = useAuth();
  const { toastError, toastSuccess } = useUi();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.includes('@')) return toastError('Digite um email válido.');
    if (password.length < 6) return toastError('Senha deve ter pelo menos 6 caracteres.');

    setLoading(true);
    const t0 = performance.now();
    try {
      log('auth.login', 'info', 'Attempt login', { email });
      await signInWithEmail(email, password);
      const ms = Math.round(performance.now() - t0);
      log('auth.login', 'info', `Login ok in ${ms}ms`);
      toastSuccess('Bem-vindo(a)! 💕');
      navigate('/');
    } catch (e: any) {
      log('auth.login', 'error', 'Login failed', { message: e?.message });
      toastError(e?.message ?? 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fullscreen-center" style={{ padding: 18 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <Card title="💒 Entrar" subtitle="Acesse seu planejamento">
          <TextField
            label="Email"
            type="email"
            value={email}
            placeholder="voce@exemplo.com"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            label="Senha"
            type="password"
            value={password}
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
            <Button loading={loading} onClick={onSubmit}>
              Entrar
            </Button>
            <Button variant="outline" onClick={() => navigate('/signup')} disabled={loading}>
              Criar conta
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} disabled={loading}>
              Voltar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

