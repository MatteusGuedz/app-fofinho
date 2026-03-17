import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { useWedding } from '../../context/WeddingContext';
import { useUi } from '../../context/UiContext';
import { supabase } from '../../lib/supabase';
import { log } from '../../lib/logger';
import { useRealtimeWedding } from '../../hooks/useRealtimeWedding';

type Guest = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  group: string | null;
  rsvp: string | null;
  dietary: string | null;
  table_name: string | null;
  notes: string | null;
};

export function GuestsPage() {
  const { wedding } = useWedding();
  const { toastError, toastSuccess, confirm } = useUi();

  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState('');
  const [filterRsvp, setFilterRsvp] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('amigos');
  const [rsvp, setRsvp] = useState('pendente');
  const [tableName, setTableName] = useState('');
  const [dietary, setDietary] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    const t0 = performance.now();
    const res = await supabase
      .from('guests')
      .select('id,name,phone,email,group,rsvp,dietary,table_name,notes')
      .eq('wedding_id', wedding.id)
      .order('name', { ascending: true });
    const ms = Math.round(performance.now() - t0);
    log('guests.load', res.error ? 'error' : 'info', `load guests in ${ms}ms`, {
      error: res.error?.message,
      count: res.data?.length,
    });
    if (res.error) toastError(res.error.message);
    setGuests((res.data as Guest[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding?.id]);

  useRealtimeWedding({
    weddingId: wedding?.id,
    tables: ['guests'],
    onChange: () => load(),
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return guests.filter((g) => {
      const okSearch = !s || g.name.toLowerCase().includes(s);
      const okRsvp = !filterRsvp || (g.rsvp ?? 'pendente') === filterRsvp;
      return okSearch && okRsvp;
    });
  }, [guests, search, filterRsvp]);

  const stats = useMemo(() => {
    const yes = guests.filter((g) => g.rsvp === 'confirmado').length;
    const no = guests.filter((g) => g.rsvp === 'recusado').length;
    const pend = guests.length - yes - no;
    return { yes, no, pend };
  }, [guests]);

  const create = async () => {
    if (!wedding) return;
    if (!name.trim()) return toastError('Digite o nome.');
    setSaving(true);
    const payload = {
      wedding_id: wedding.id,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      group,
      rsvp,
      table_name: tableName.trim() || null,
      dietary: dietary.trim() || null,
      notes: notes.trim() || null,
    };
    const t0 = performance.now();
    const res = await supabase
      .from('guests')
      .insert(payload)
      .select('id,name,phone,email,group,rsvp,dietary,table_name,notes')
      .single();
    const ms = Math.round(performance.now() - t0);
    log('guests.create', res.error ? 'error' : 'info', `create guest in ${ms}ms`, {
      payload,
      error: res.error?.message,
    });
    if (res.error) {
      toastError(res.error.message);
      setSaving(false);
      return;
    }
    setGuests((prev) => [res.data as Guest, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    setModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setTableName('');
    setDietary('');
    setNotes('');
    setGroup('amigos');
    setRsvp('pendente');
    toastSuccess('Convidado adicionado! 🎉');
    setSaving(false);
  };

  const remove = async (g: Guest) => {
    if (!wedding) return;
    const ok = await confirm({
      title: 'Remover convidado?',
      body: `Deseja remover “${g.name}”?`,
      confirmText: 'Remover',
      danger: true,
    });
    if (!ok) return;

    const t0 = performance.now();
    const res = await supabase.from('guests').delete().eq('id', g.id).eq('wedding_id', wedding.id);
    const ms = Math.round(performance.now() - t0);
    log('guests.delete', res.error ? 'error' : 'info', `delete guest in ${ms}ms`, {
      id: g.id,
      error: res.error?.message,
    });
    if (res.error) return toastError(res.error.message);
    setGuests((prev) => prev.filter((x) => x.id !== g.id));
    toastSuccess('Convidado removido.');
  };

  const quickRsvp = async (g: Guest, next: string) => {
    if (!wedding) return;
    const t0 = performance.now();
    const res = await supabase
      .from('guests')
      .update({ rsvp: next })
      .eq('id', g.id)
      .eq('wedding_id', wedding.id);
    const ms = Math.round(performance.now() - t0);
    log('guests.rsvp', res.error ? 'error' : 'info', `update rsvp in ${ms}ms`, {
      id: g.id,
      next,
      error: res.error?.message,
    });
    if (res.error) return toastError(res.error.message);
    setGuests((prev) => prev.map((x) => (x.id === g.id ? { ...x, rsvp: next } : x)));
    toastSuccess('RSVP atualizado 💌');
  };

  if (!wedding) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="👥 Convidados" subtitle={`Total: ${guests.length} · ✅ ${stats.yes} · ⏳ ${stats.pend} · ❌ ${stats.no}`}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <TextField
              label="Buscar"
              value={search}
              placeholder="Nome..."
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="field" style={{ minWidth: 180 }}>
              <label className="field-label" htmlFor="rf">
                RSVP
              </label>
              <select id="rf" className="field-input" value={filterRsvp} onChange={(e) => setFilterRsvp(e.target.value)}>
                <option value="">Todos</option>
                <option value="confirmado">✅ Confirmado</option>
                <option value="pendente">⏳ Pendente</option>
                <option value="recusado">❌ Recusado</option>
              </select>
            </div>
          </div>
          <Button onClick={() => setModalOpen(true)}>+ Adicionar</Button>
        </div>
      </Card>

      <Card title="📒 Lista" subtitle="Atualize RSVP sem precisar de F5">
        {loading ? (
          <div className="muted">Carregando…</div>
        ) : filtered.length ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {filtered.map((g) => (
              <div key={g.id} style={{ padding: '10px 10px', borderRadius: 14, border: '1px solid rgba(232,180,184,.35)', background: 'rgba(255,255,255,.7)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,var(--rose),var(--gold))', color: 'white', fontWeight: 900 }}>
                    {(g.name[0] ?? '?').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                    <div className="muted">
                      {(g.group ? `👤 ${g.group}` : '')}
                      {g.phone ? ` · 📱 ${g.phone}` : ''}
                      {g.table_name ? ` · 🪑 ${g.table_name}` : ''}
                      {g.dietary ? ` · 🌱 ${g.dietary}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Button variant="outline" onClick={() => quickRsvp(g, 'confirmado')}>✅</Button>
                    <Button variant="outline" onClick={() => quickRsvp(g, 'pendente')}>⏳</Button>
                    <Button variant="outline" onClick={() => quickRsvp(g, 'recusado')}>❌</Button>
                    <Button variant="ghost" onClick={() => remove(g)}>🗑️</Button>
                  </div>
                </div>
                {g.notes ? <div className="muted" style={{ marginTop: 6 }}>📝 {g.notes}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">Nenhum convidado encontrado.</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button variant="ghost" onClick={load}>🔄 Atualizar</Button>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title="👤 Adicionar convidado"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button loading={saving} onClick={create}>Salvar</Button>
          </>
        }
      >
        <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <TextField label="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="field">
            <label className="field-label" htmlFor="grp">Grupo</label>
            <select id="grp" className="field-input" value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="familiaNoiva">👗 Família Noiva</option>
              <option value="familiaNoivo">🤵 Família Noivo</option>
              <option value="amigos">👫 Amigos</option>
              <option value="trabalho">💼 Trabalho</option>
              <option value="outro">👤 Outro</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="rsvp">RSVP</label>
            <select id="rsvp" className="field-input" value={rsvp} onChange={(e) => setRsvp(e.target.value)}>
              <option value="pendente">⏳ Pendente</option>
              <option value="confirmado">✅ Confirmado</option>
              <option value="recusado">❌ Recusado</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <TextField label="Mesa" value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="Mesa 1..." />
          <TextField label="Restrição alimentar" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Vegetariano..." />
        </div>
        <TextField label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Algo importante..." />
      </Modal>
    </div>
  );
}

