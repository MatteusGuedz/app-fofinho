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

type MoodRef = {
  id: string;
  title: string;
  category: string | null;
  image_url: string | null;
  link_url: string | null;
  notes: string | null;
};

export function MoodboardPage() {
  const { wedding } = useWedding();
  const { toastError, toastSuccess, confirm } = useUi();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MoodRef[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('decoracao');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    const t0 = performance.now();
    const res = await supabase
      .from('mood_refs')
      .select('id,title,category,image_url,link_url,notes')
      .eq('wedding_id', wedding.id)
      .order('created_at', { ascending: false });
    const ms = Math.round(performance.now() - t0);
    log('mood.load', res.error ? 'error' : 'info', `load mood in ${ms}ms`, {
      error: res.error?.message,
      count: res.data?.length,
    });
    if (res.error) toastError(res.error.message);
    setItems((res.data as MoodRef[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding?.id]);

  useRealtimeWedding({
    weddingId: wedding?.id,
    tables: ['mood_refs'],
    onChange: () => load(),
  });

  const previewOk = useMemo(() => {
    const u = imageUrl.trim();
    return u.startsWith('http://') || u.startsWith('https://');
  }, [imageUrl]);

  const create = async () => {
    if (!wedding) return;
    if (!title.trim()) return toastError('Digite um título.');
    setSaving(true);
    const payload = {
      wedding_id: wedding.id,
      title: title.trim(),
      category,
      image_url: imageUrl.trim() || null,
      link_url: linkUrl.trim() || null,
      notes: notes.trim() || null,
    };
    const t0 = performance.now();
    const res = await supabase
      .from('mood_refs')
      .insert(payload)
      .select('id,title,category,image_url,link_url,notes')
      .single();
    const ms = Math.round(performance.now() - t0);
    log('mood.create', res.error ? 'error' : 'info', `create mood in ${ms}ms`, {
      error: res.error?.message,
    });
    if (res.error) {
      toastError(res.error.message);
      setSaving(false);
      return;
    }
    toastSuccess('Adicionado ao moodboard 🖼️');
    setModalOpen(false);
    setTitle('');
    setImageUrl('');
    setLinkUrl('');
    setNotes('');
    setCategory('decoracao');
    setSaving(false);
  };

  const remove = async (it: MoodRef) => {
    if (!wedding) return;
    const ok = await confirm({
      title: 'Remover referência?',
      body: `Deseja remover “${it.title}”?`,
      confirmText: 'Remover',
      danger: true,
    });
    if (!ok) return;
    const t0 = performance.now();
    const res = await supabase.from('mood_refs').delete().eq('id', it.id).eq('wedding_id', wedding.id);
    const ms = Math.round(performance.now() - t0);
    log('mood.delete', res.error ? 'error' : 'info', `delete mood in ${ms}ms`, {
      error: res.error?.message,
    });
    if (res.error) return toastError(res.error.message);
    toastSuccess('Removido.');
    setItems((prev) => prev.filter((x) => x.id !== it.id));
  };

  if (!wedding) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="🖼️ Moodboard" subtitle="Com preview das imagens (URL)">
        <div className="muted">
          Cole links de referência e imagens para organizar inspirações. (Depois podemos integrar Supabase Storage para upload.)
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button onClick={() => setModalOpen(true)}>+ Nova referência</Button>
        </div>
      </Card>

      <Card title="✨ Inspirações" subtitle="Clique para abrir links">
        {loading ? (
          <div className="muted">Carregando…</div>
        ) : items.length ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 10,
            }}
          >
            {items.map((it) => (
              <div
                key={it.id}
                style={{
                  borderRadius: 16,
                  border: '1px solid rgba(232,180,184,.35)',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,.75)',
                  position: 'relative',
                }}
              >
                <div style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg,#fdf0f1,#f5e6d3)' }}>
                  {it.image_url ? (
                    <img
                      src={it.image_url}
                      alt={it.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="fullscreen-center" style={{ minHeight: 140 }}>
                      <div style={{ fontSize: '2rem' }}>✨</div>
                      <div className="muted" style={{ textAlign: 'center', padding: '0 10px' }}>
                        {it.title}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontWeight: 900 }}>{it.title}</div>
                  <div className="muted">{it.category ?? 'outro'}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {it.link_url ? (
                      <Button
                        variant="outline"
                        onClick={() => window.open(it.link_url ?? '', '_blank', 'noopener,noreferrer')}
                      >
                        🔗 Abrir
                      </Button>
                    ) : null}
                    <Button variant="ghost" onClick={() => remove(it)}>
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">Adicione sua primeira referência 💕</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button variant="ghost" onClick={load}>
            🔄 Atualizar
          </Button>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title="🖼️ Nova referência"
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
        <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="field">
          <label className="field-label" htmlFor="mc">
            Categoria
          </label>
          <select id="mc" className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="decoracao">🌸 Decoração</option>
            <option value="flores">💐 Flores</option>
            <option value="vestido">👗 Vestido</option>
            <option value="bolo">🎂 Bolo</option>
            <option value="local">🏛️ Local</option>
            <option value="outro">✨ Outro</option>
          </select>
        </div>
        <TextField
          label="🖼️ URL da imagem"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          hint={previewOk ? 'Preview abaixo' : 'Cole um link http(s) para mostrar preview'}
        />
        {previewOk ? (
          <div
            className="card"
            style={{
              padding: 10,
              background: 'linear-gradient(135deg,#fdf0f1,#f5e6d3)',
              marginBottom: 10,
            }}
          >
            <div className="muted" style={{ marginBottom: 6 }}>
              Preview
            </div>
            <img
              src={imageUrl.trim()}
              alt="preview"
              style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 12 }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : null}
        <TextField
          label="🔗 Link de referência"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://..."
        />
        <TextField label="Por que amei isso?" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Modal>
    </div>
  );
}

