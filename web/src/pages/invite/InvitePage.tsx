import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUi } from '../../context/UiContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

type InviteInfo = { wedding_id: string; name_1: string; name_2: string };

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toastError, toastSuccess } = useUi();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const redirectUrl = token ? `/invite/${token}` : '/';

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('get_invite_by_token', {
        invite_token: token,
      });
      if (cancelled) return;
      if (error || !data?.length) {
        setInvalid(true);
        setInvite(null);
      } else {
        setInvite(data[0] as InviteInfo);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleAccept = async () => {
    if (!token || !user) return;
    setAccepting(true);
    try {
      await supabase.rpc('accept_invite', { invite_token: token });
      toastSuccess('Convite aceito! Agora você planeja junto 💕');
      navigate('/', { replace: true });
      window.location.reload(); // força refresh do WeddingContext
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Não foi possível aceitar o convite.';
      toastError(msg);
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="auth-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <div className="auth-rings">💍</div>
          <div className="auth-title" style={{ fontSize: '1.4rem' }}>Carregando convite…</div>
        </div>
      </div>
    );
  }

  if (invalid || !invite) {
    return (
      <div className="auth-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <div className="auth-rings">💒</div>
          <div className="auth-title" style={{ fontSize: '1.4rem' }}>Convite inválido ou expirado</div>
          <div className="auth-sub" style={{ marginTop: 12 }}>Este link não está mais disponível.</div>
          <Button className="auth-btn" style={{ marginTop: 24 }} onClick={() => navigate('/')}>
            Ir para o início
          </Button>
        </div>
      </div>
    );
  }

  const names = `${invite.name_1} & ${invite.name_2}`;

  if (!user) {
    return (
      <div className="auth-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <div className="auth-rings">💍</div>
          <div className="auth-title" style={{ fontSize: '1.5rem' }}>Você foi convidado(a)!</div>
          <div className="auth-sub" style={{ marginTop: 8 }}>{names} te convidou para planejar o casamento.</div>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem', marginTop: 20 }}>
            Faça login ou crie uma conta para aceitar o convite e acessar o planejamento.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <Button
              className="auth-btn"
              onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`)}
            >
              Entrar na minha conta
            </Button>
            <Button
              variant="outline"
              style={{ borderColor: 'rgba(201,165,90,.4)', color: 'rgba(255,255,255,.9)' }}
              onClick={() => navigate(`/signup?redirect=${encodeURIComponent(redirectUrl)}`)}
            >
              Criar conta
            </Button>
            <button type="button" className="auth-link" style={{ marginTop: 8 }} onClick={() => navigate('/')}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-box" style={{ textAlign: 'center' }}>
        <div className="auth-rings">💍</div>
        <div className="auth-title" style={{ fontSize: '1.5rem' }}>Aceitar convite?</div>
        <div className="auth-sub" style={{ marginTop: 8 }}>{names} te convidou para planejar o casamento junto(a).</div>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.85rem', marginTop: 16 }}>
          Você terá acesso ao mesmo checklist, convidados, orçamento e moodboard.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          <Button variant="outline" style={{ borderColor: 'rgba(255,255,255,.3)', color: 'rgba(255,255,255,.8)' }} onClick={() => navigate('/')}>
            Agora não
          </Button>
          <Button loading={accepting} onClick={handleAccept}>
            Aceitar convite
          </Button>
        </div>
      </div>
    </div>
  );
}
