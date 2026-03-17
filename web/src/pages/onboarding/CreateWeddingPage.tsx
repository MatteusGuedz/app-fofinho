import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useUi } from '../../context/UiContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { log } from '../../lib/logger';
import { useWedding } from '../../context/WeddingContext';

export function OnboardingCreateWeddingPage() {
  const { user } = useAuth();
  const { wedding, refresh } = useWedding();
  const { toastError, toastSuccess } = useUi();
  const navigate = useNavigate();

  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);

  if (wedding) {
    return (
      <div className="fullscreen-center" style={{ padding: 18 }}>
        <Card title="🎉 Casamento já configurado" subtitle="Você pode ajustar em Configurações">
          <Button onClick={() => navigate('/')}>Ir para o Dashboard</Button>
        </Card>
      </div>
    );
  }

  const onCreate = async () => {
    if (!user) return toastError('Você precisa estar logado(a).');
    if (!name1.trim() || !name2.trim()) return toastError('Preencha os dois nomes.');
    setLoading(true);

    const payload = {
      owner_id: user.id,
      name_1: name1.trim(),
      name_2: name2.trim(),
      wedding_date: date ? date : null,
      venue_name: venue.trim() || null,
      budget_total: budget ? Number(budget) : null,
      tier: 'mid',
      happened_at: null,
      purge_at: null,
    };

    const t0 = performance.now();
    const { error } = await supabase.from('weddings').insert(payload);
    const ms = Math.round(performance.now() - t0);
    log('wedding.create', error ? 'error' : 'info', `insert wedding in ${ms}ms`, {
      payload,
      error,
    });

    if (error) {
      toastError(error.message);
      setLoading(false);
      return;
    }

    toastSuccess('Casamento criado! 💕');
    await refresh();
    navigate('/');
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card
        title="✨ Vamos começar"
        subtitle="Cadastre o casamento para liberar o dashboard"
      >
        <TextField label="Nome 1" value={name1} onChange={(e) => setName1(e.target.value)} />
        <TextField label="Nome 2" value={name2} onChange={(e) => setName2(e.target.value)} />
        <TextField
          label="📅 Data do casamento"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <TextField
          label="📍 Local"
          value={venue}
          placeholder="Nome do espaço..."
          onChange={(e) => setVenue(e.target.value)}
        />
        <TextField
          label="💰 Orçamento total (R$)"
          type="number"
          value={budget}
          placeholder="0"
          onChange={(e) => setBudget(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button loading={loading} onClick={onCreate}>
            Criar
          </Button>
        </div>
      </Card>
    </div>
  );
}

