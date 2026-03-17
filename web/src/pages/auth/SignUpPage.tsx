import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { log } from '../../lib/logger';

export function SignUpPage() {
  const { signUpWithEmail } = useAuth();
  const { toastError, toastSuccess } = useUi();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.includes('@')) return toastError('Digite um email válido.');
    if (password.length < 6) return toastError('Senha deve ter pelo menos 6 caracteres.');
    if (password !== password2) return toastError('As senhas não conferem.');

    setLoading(true);
    const t0 = performance.now();
    try {
      log('auth.signup', 'info', 'Attempt signup', { email });
      await signUpWithEmail(email, password);
      const ms = Math.round(performance.now() - t0);
      log('auth.signup', 'info', `Signup ok in ${ms}ms`);
      toastSuccess('Conta criada! Agora faça login 💕');
      navigate('/login');
    } catch (e: any) {
      log('auth.signup', 'error', 'Signup failed', { message: e?.message });
      toastError(e?.message ?? 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fullscreen-center" style={{ padding: 18 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <Card title="✨ Criar conta" subtitle="Comece seu planejamento a dois">
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
            placeholder="mínimo 6 caracteres"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <TextField
            label="Confirmar senha"
            type="password"
            value={password2}
            placeholder="repita a senha"
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
          />
          <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
            <Button loading={loading} onClick={onSubmit}>
              Criar conta
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')} disabled={loading}>
              Já tenho conta
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

