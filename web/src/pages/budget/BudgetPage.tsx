import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { useWedding } from '../../context/WeddingContext';
import { useUi } from '../../context/UiContext';
import { supabase } from '../../lib/supabase';
import { log } from '../../lib/logger';
import { formatBRL } from '../../lib/format';
import { useRealtimeWedding } from '../../hooks/useRealtimeWedding';

type BudgetItem = {
  id: string;
  name: string;
  category: string | null;
  eco: number | null;
  mid: number | null;
  prem: number | null;
  qty: number | null;
  unit: string | null;
  status: string | null;
  vendor_name: string | null;
  notes: string | null;
};

export function BudgetPage() {
  const { wedding } = useWedding();
  const { toastError, toastSuccess, confirm } = useUi();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('outro');
  const [eco, setEco] = useState('');
  const [mid, setMid] = useState('');
  const [prem, setPrem] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('serviço');
  const [status, setStatus] = useState('pesquisando');
  const [vendorName, setVendorName] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    const t0 = performance.now();
    const res = await supabase
      .from('budget_items')
      .select('id,name,category,eco,mid,prem,qty,unit,status,vendor_name,notes')
      .eq('wedding_id', wedding.id)
      .order('name', { ascending: true });
    const ms = Math.round(performance.now() - t0);
    log('budget.load', res.error ? 'error' : 'info', `load budget in ${ms}ms`, {
      error: res.error?.message,
      count: res.data?.length,
    });
    if (res.error) toastError(res.error.message);
    setItems((res.data as BudgetItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding?.id]);

  useRealtimeWedding({
    weddingId: wedding?.id,
    tables: ['budget_items'],
    onChange: () => load(),
  });

  const tier = wedding?.tier ?? 'mid';
  const spent = useMemo(() => {
    return items.reduce((acc, b) => {
      const q = b.qty ?? 1;
      const v = tier === 'eco' ? b.eco ?? 0 : tier === 'prem' ? b.prem ?? 0 : b.mid ?? 0;
      return acc + v * q;
    }, 0);
  }, [items, tier]);

  const budgetTotal = wedding?.budget_total ?? 0;
  const pct = budgetTotal > 0 ? Math.min(100, Math.round((spent / budgetTotal) * 100)) : 0;

  const estimateCurrentTier = useMemo(() => {
    const q = Number(qty || 1);
    const v = tier === 'eco' ? Number(eco || 0) : tier === 'prem' ? Number(prem || 0) : Number(mid || 0);
    return v * q;
  }, [eco, mid, prem, qty, tier]);

  const create = async () => {
    if (!wedding) return;
    if (!name.trim()) return toastError('Digite o nome do item.');
    setSaving(true);
    const payload = {
      wedding_id: wedding.id,
      name: name.trim(),
      category,
      eco: eco ? Number(eco) : 0,
      mid: mid ? Number(mid) : 0,
      prem: prem ? Number(prem) : 0,
      qty: qty ? Number(qty) : 1,
      unit: unit.trim() || null,
      status,
      vendor_name: vendorName.trim() || null,
      notes: notes.trim() || null,
    };
    const t0 = performance.now();
    const res = await supabase
      .from('budget_items')
      .insert(payload)
      .select('id,name,category,eco,mid,prem,qty,unit,status,vendor_name,notes')
      .single();
    const ms = Math.round(performance.now() - t0);
    log('budget.create', res.error ? 'error' : 'info', `create budget item in ${ms}ms`, {
      payload,
      error: res.error?.message,
    });
    if (res.error) {
      toastError(res.error.message);
      setSaving(false);
      return;
    }
    setItems((prev) => [res.data as BudgetItem, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    setModalOpen(false);
    setName('');
    setEco('');
    setMid('');
    setPrem('');
    setQty('1');
    setUnit('serviço');
    setStatus('pesquisando');
    setVendorName('');
    setNotes('');
    setCategory('outro');
    toastSuccess('Item adicionado! 💰');
    setSaving(false);
  };

  const remove = async (it: BudgetItem) => {
    if (!wedding) return;
    const ok = await confirm({
      title: 'Remover item?',
      body: `Deseja remover “${it.name}”?`,
      confirmText: 'Remover',
      danger: true,
    });
    if (!ok) return;

    const t0 = performance.now();
    const res = await supabase
      .from('budget_items')
      .delete()
      .eq('id', it.id)
      .eq('wedding_id', wedding.id);
    const ms = Math.round(performance.now() - t0);
    log('budget.delete', res.error ? 'error' : 'info', `delete budget item in ${ms}ms`, {
      id: it.id,
      error: res.error?.message,
    });
    if (res.error) return toastError(res.error.message);
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    toastSuccess('Removido.');
  };

  if (!wedding) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="💰 Orçamento" subtitle={`Faixa atual: ${tier.toUpperCase()} · Orçado: ${formatBRL(spent)}`}>
        <div className="muted" style={{ marginTop: 4 }}>
          {budgetTotal ? `Progresso: ${pct}% de ${formatBRL(budgetTotal)}` : 'Defina o total em Configurações'}
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => setModalOpen(true)}>+ Adicionar item</Button>
        </div>
      </Card>

      <Card title="📦 Itens" subtitle="Lista organizada (responsivo)">
        {loading ? (
          <div className="muted">Carregando…</div>
        ) : items.length ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {items.map((it) => {
              const q = it.qty ?? 1;
              const v = tier === 'eco' ? it.eco ?? 0 : tier === 'prem' ? it.prem ?? 0 : it.mid ?? 0;
              const total = v * q;
              return (
                <div key={it.id} style={{ padding: '10px 10px', borderRadius: 14, border: '1px solid rgba(232,180,184,.35)', background: 'rgba(255,255,255,.7)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {it.name}
                      </div>
                      <div className="muted">
                        {it.category ? `🏷️ ${it.category}` : ''}{' '}
                        {it.vendor_name ? `· 🏪 ${it.vendor_name}` : ''}{' '}
                        {it.status ? `· ${it.status}` : ''}
                      </div>
                      <div className="muted" style={{ marginTop: 4 }}>
                        {formatBRL(total)}{' '}
                        <span style={{ color: 'var(--text-muted)' }}>
                          ({q} {it.unit ?? ''} · {tier})
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => remove(it)}>
                      🗑️
                    </Button>
                  </div>
                  {it.notes ? <div className="muted" style={{ marginTop: 6 }}>📝 {it.notes}</div> : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="muted">Sem itens no orçamento ainda.</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button variant="ghost" onClick={load}>🔄 Atualizar</Button>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title="💰 Novo item"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button loading={saving} onClick={create}>
              Salvar
            </Button>
          </>
        }
      >
        <TextField label="Item" value={name} onChange={(e) => setName(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="field">
            <label className="field-label" htmlFor="cat">Categoria</label>
            <select id="cat" className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="local">🏛️ Local</option>
              <option value="decoracao">🌸 Decoração</option>
              <option value="buffet">🍽️ Buffet</option>
              <option value="musica">🎵 Música</option>
              <option value="foto">📸 Foto/Vídeo</option>
              <option value="vestuario">👗 Vestuário</option>
              <option value="papelaria">💌 Papelaria</option>
              <option value="outro">📌 Outro</option>
            </select>
          </div>
          <TextField label="Fornecedor (opcional)" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <TextField label="Eco" type="number" value={eco} onChange={(e) => setEco(e.target.value)} />
          <TextField label="Médio" type="number" value={mid} onChange={(e) => setMid(e.target.value)} />
          <TextField label="Premium" type="number" value={prem} onChange={(e) => setPrem(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <TextField label="Qtd" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          <TextField label="Unidade" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="st">Status</label>
          <select id="st" className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pesquisando">🔍 Pesquisando</option>
            <option value="orcado">📋 Orçado</option>
            <option value="aprovado">✅ Aprovado</option>
            <option value="pago">💳 Pago</option>
          </select>
        </div>
        <div className="card" style={{ padding: 12, background: 'linear-gradient(135deg,#fdf0f1,#f5e6d3)' }}>
          <div className="muted">Total estimado (faixa {tier === 'eco' ? 'Eco' : tier === 'prem' ? 'Premium' : 'Médio'})</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--rose-deep)' }}>
            {formatBRL(estimateCurrentTier)}
          </div>
          {(() => {
            const q = Number(qty || 1);
            const v = tier === 'eco' ? Number(eco || 0) : tier === 'prem' ? Number(prem || 0) : Number(mid || 0);
            if (q > 1 && v > 0) {
              return (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {formatBRL(v)} × {q} {Number(qty || 1) === 1 ? '' : 'un.'}
                </div>
              );
            }
            return null;
          })()}
        </div>
        <TextField label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Modal>
    </div>
  );
}

