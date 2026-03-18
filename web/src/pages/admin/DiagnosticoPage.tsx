import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getLogs, clearLogs } from '../../lib/logger';
import { useUi } from '../../context/UiContext';
import { useAuth } from '../../context/AuthContext';
import { isAdminEmail } from '../../lib/env';

/**
 * Rota exclusiva para diagnóstico (logs locais).
 * Só acessa quem estiver logado com o e-mail de admin (VITE_ADMIN_EMAIL).
 */
export function DiagnosticoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toastSuccess, confirm } = useUi();
  const isAdmin = isAdminEmail(user?.email ?? undefined);

  if (!isAdmin) {
    return (
      <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        <Card title="Acesso restrito" subtitle="Área exclusiva para administrador">
          <div className="muted" style={{ marginBottom: 16 }}>
            Você não tem permissão para acessar esta página.
          </div>
          <Button onClick={() => navigate('/settings')}>Voltar às configurações</Button>
        </Card>
      </div>
    );
  }
  const [refreshKey, setRefreshKey] = useState(0);

  const logs = useMemo(
    () => getLogs().slice().reverse().slice(0, 100),
    [refreshKey],
  );

  const clearLocalLogs = async () => {
    const ok = await confirm({
      title: 'Limpar logs locais?',
      body: 'Isso apaga apenas os logs armazenados no navegador (não afeta dados do casamento).',
      confirmText: 'Limpar',
      danger: true,
    });
    if (!ok) return;
    clearLogs();
    setRefreshKey((k) => k + 1);
    toastSuccess('Logs limpos.');
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="🧪 Diagnóstico" subtitle="Logs locais (últimos 100 eventos) — acesso admin">
        <div className="muted" style={{ marginBottom: 12 }}>
          Acesso restrito ao e-mail de administrador. Use para depuração e suporte.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
            Atualizar
          </Button>
          <Button variant="outline" onClick={clearLocalLogs}>
            Limpar logs
          </Button>
          <Button variant="ghost" onClick={() => navigate('/settings')}>
            ← Voltar às configurações
          </Button>
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          {logs.length ? (
            logs.map((l) => (
              <div
                key={l.id}
                style={{
                  border: '1px solid rgba(232,180,184,.35)',
                  borderRadius: 14,
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,.7)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <strong
                    style={{
                      color:
                        l.level === 'error' ? '#b71c1c' : l.level === 'warn' ? '#7a5a00' : 'var(--text)',
                    }}
                  >
                    [{l.scope}] {l.message}
                  </strong>
                  <span className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(l.at).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                {l.data ? (
                  <pre
                    style={{
                      margin: '8px 0 0',
                      padding: 10,
                      borderRadius: 12,
                      background: 'rgba(0,0,0,.05)',
                      overflowX: 'auto',
                      fontSize: 12,
                    }}
                  >
                    {JSON.stringify(l.data, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          ) : (
            <div className="muted">Sem logs ainda.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
