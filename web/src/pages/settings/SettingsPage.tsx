import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useWedding } from '../../context/WeddingContext';
import { useUi } from '../../context/UiContext';
import { supabase } from '../../lib/supabase';
import { log, getLogs, clearLogs } from '../../lib/logger';
import { formatBRL } from '../../lib/format';
import { exportBackup, importBackup, type BackupV1 } from '../../lib/backup';

export function SettingsPage() {
  const { wedding, refresh } = useWedding();
  const { toastError, toastSuccess, confirm } = useUi();

  const [tier, setTier] = useState(wedding?.tier ?? 'mid');
  const [budgetTotal, setBudgetTotal] = useState(String(wedding?.budget_total ?? ''));
  const [venueName, setVenueName] = useState(wedding?.venue_name ?? '');
  const [date, setDate] = useState(wedding?.wedding_date ?? '');
  const [saving, setSaving] = useState(false);

  const logs = useMemo(() => getLogs().slice().reverse().slice(0, 50), []);

  const save = async () => {
    if (!wedding) return;
    setSaving(true);
    const payload = {
      tier,
      budget_total: budgetTotal ? Number(budgetTotal) : null,
      venue_name: venueName.trim() || null,
      wedding_date: date || null,
    };
    const t0 = performance.now();
    const res = await supabase.from('weddings').update(payload).eq('id', wedding.id);
    const ms = Math.round(performance.now() - t0);
    log('settings.save', res.error ? 'error' : 'info', `update wedding in ${ms}ms`, {
      payload,
      error: res.error?.message,
    });
    if (res.error) {
      toastError(res.error.message);
      setSaving(false);
      return;
    }
    toastSuccess('Configurações salvas 💕');
    await refresh();
    setSaving(false);
  };

  const markHappened = async () => {
    if (!wedding) return;
    const ok = await confirm({
      title: 'O casamento aconteceu? 🎉',
      body:
        'Ao confirmar, o app marca o casamento como concluído e agenda uma limpeza automática dos dados em 30 dias (para privacidade). Você ainda poderá exportar um backup antes.',
      confirmText: 'Confirmar',
      danger: true,
    });
    if (!ok) return;

    const happenedAt = new Date().toISOString();
    const purgeAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const t0 = performance.now();
    const res = await supabase
      .from('weddings')
      .update({ happened_at: happenedAt, purge_at: purgeAt })
      .eq('id', wedding.id);
    const ms = Math.round(performance.now() - t0);
    log('wedding.happened', res.error ? 'error' : 'warn', `mark happened in ${ms}ms`, {
      happenedAt,
      purgeAt,
      error: res.error?.message,
    });
    if (res.error) return toastError(res.error.message);
    toastSuccess('Marcado! Lembre de exportar um backup 💾');
    await refresh();
  };

  const clearLocalLogs = async () => {
    const ok = await confirm({
      title: 'Limpar logs locais?',
      body: 'Isso apaga apenas logs armazenados no navegador (não afeta dados do casamento).',
      confirmText: 'Limpar',
      danger: true,
    });
    if (!ok) return;
    clearLogs();
    toastSuccess('Logs limpos.');
    location.reload();
  };

  const doExport = async () => {
    if (!wedding) return;
    try {
      toastSuccess('Gerando backup… 💾');
      const backup = await exportBackup(wedding.id);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `wedding_backup_${wedding.id}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      toastSuccess('Backup exportado! ✅');
    } catch (e: any) {
      toastError(e?.message ?? 'Erro ao exportar backup.');
    }
  };

  const onImportFile = async (file: File) => {
    if (!wedding) return;
    const ok = await confirm({
      title: 'Importar backup?',
      body: 'Isso vai substituir as listas (tarefas, convidados e orçamento) do seu casamento atual. Recomendado exportar um backup antes.',
      confirmText: 'Importar',
      danger: true,
    });
    if (!ok) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text) as BackupV1;
      if (!json || json.version !== 1) {
        return toastError('Backup inválido (versão incompatível).');
      }
      toastSuccess('Importando… ⏳');
      await importBackup(wedding.id, json);
      toastSuccess('Importado! 🎉');
      await refresh();
    } catch (e: any) {
      toastError(e?.message ?? 'Erro ao importar backup.');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="⚙️ Configurações" subtitle="Tudo salvo com logs e confirmação">
        {!wedding ? (
          <div className="muted">Crie um casamento no onboarding.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <TextField
                label="📅 Data"
                type="date"
                value={date ?? ''}
                onChange={(e) => setDate(e.target.value)}
              />
              <TextField
                label="📍 Local"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <TextField
                label="💰 Orçamento total (R$)"
                type="number"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                hint={budgetTotal ? `Total: ${formatBRL(Number(budgetTotal))}` : undefined}
              />
              <div className="field">
                <label className="field-label" htmlFor="tier">
                  Faixa
                </label>
                <select
                  id="tier"
                  className="field-input"
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                >
                  <option value="eco">Eco</option>
                  <option value="mid">Médio</option>
                  <option value="prem">Premium</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <Button variant="outline" onClick={() => refresh()} disabled={saving}>
                🔄 Atualizar
              </Button>
              <Button loading={saving} onClick={save}>
                Salvar
              </Button>
            </div>
          </>
        )}
      </Card>

      <Card title="💾 Backup" subtitle="Exportar e importar tudo do app (MVP)">
        <div className="muted">
          Exporta e importa tarefas, convidados e orçamento. (Em seguida vamos incluir fornecedores, decoração, etc.)
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 10 }}>
          <Button variant="outline" onClick={doExport}>
            Exportar backup
          </Button>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            Importar backup
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportFile(f);
                e.currentTarget.value = '';
              }}
            />
          </label>
        </div>
      </Card>

      <Card title="🎉 Pós-casamento" subtitle="Privacidade e segurança">
        <div className="muted">
          Se você marcar que o casamento aconteceu, o app agenda uma limpeza automática para daqui 30 dias. (A limpeza real deve ser executada via job/cron no Supabase — o app já guarda a data.)
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button className="btn-danger" onClick={markHappened}>
            O casamento aconteceu
          </Button>
        </div>
        {wedding?.purge_at ? (
          <div className="muted" style={{ marginTop: 8 }}>
            🧹 Limpeza agendada para: {new Date(wedding.purge_at).toLocaleString('pt-BR')}
          </div>
        ) : null}
      </Card>

      <Card title="🧪 Diagnóstico" subtitle="Logs locais (últimos 50 eventos)">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={clearLocalLogs}>
            Limpar logs
          </Button>
        </div>
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {logs.length ? (
            logs.map((l) => (
              <div
                key={l.id}
                style={{
                  border: '1px solid rgba(232,180,184,.35)',
                  borderRadius: 14,
                  padding: '10px 10px',
                  background: 'rgba(255,255,255,.7)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong style={{ color: l.level === 'error' ? '#b71c1c' : l.level === 'warn' ? '#7a5a00' : 'var(--text)' }}>
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

