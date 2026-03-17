import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="fullscreen-center" style={{ padding: 18 }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: '2.5rem' }}>💍</div>
          <h1 style={{ fontSize: '2.3rem', color: 'var(--rose-deep)' }}>Wedding Fofinho</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Um dashboard romântico e profissional para organizar o casamento a dois.
          </p>
        </div>

        <Card
          title="✨ Tudo em um só lugar"
          subtitle="Checklist • Convidados • Orçamento • Relatórios"
        >
          <div style={{ display: 'grid', gap: 10 }}>
            <Button onClick={() => navigate('/signup')}>Criar minha conta</Button>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Já tenho conta
            </Button>
            <p className="muted" style={{ textAlign: 'center' }}>
              Dados persistidos no Supabase (só configurar `.env`).
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

