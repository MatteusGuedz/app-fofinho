import { useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useWedding } from '../../context/WeddingContext';
import { formatBRL, formatDateBR } from '../../lib/format';

export function ReportsPage() {
  const { wedding } = useWedding();

  const title = useMemo(() => {
    if (!wedding) return 'Relatório';
    return `Relatório — ${wedding.name_1} & ${wedding.name_2}`;
  }, [wedding]);

  if (!wedding) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="📊 Relatórios" subtitle="Versão A4 bonita para imprimir e compartilhar">
        <div className="muted">
          Aqui você terá o relatório completo. Nesta primeira entrega, já deixei o layout A4 preparado e o botão de imprimir/exportar.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button
            variant="outline"
            onClick={() => {
              window.print();
            }}
          >
            🖨️ Imprimir / Salvar em PDF
          </Button>
        </div>
      </Card>

      <div className="a4">
        <div className="a4-header">
          <div>
            <div className="a4-kicker">Wedding Fofinho</div>
            <div className="a4-title">{title}</div>
            <div className="a4-sub">{wedding.wedding_date ? `📅 ${formatDateBR(wedding.wedding_date)}` : '📅 Data não definida'}</div>
          </div>
          <div className="a4-badge">💍</div>
        </div>

        <div className="a4-grid">
          <div className="a4-box">
            <div className="a4-label">Local</div>
            <div className="a4-value">{wedding.venue_name ?? '—'}</div>
          </div>
          <div className="a4-box">
            <div className="a4-label">Orçamento total</div>
            <div className="a4-value">{formatBRL(wedding.budget_total ?? 0)}</div>
          </div>
          <div className="a4-box">
            <div className="a4-label">Faixa</div>
            <div className="a4-value">{wedding.tier.toUpperCase()}</div>
          </div>
          <div className="a4-box">
            <div className="a4-label">Gerado em</div>
            <div className="a4-value">{new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>

        <div className="a4-section">
          <div className="a4-section-title">Resumo</div>
          <div className="a4-par">
            Este relatório é o “resumo fofinho” do casamento. Nas próximas entregas, ele vai puxar convidados, orçamento e checklist do Supabase automaticamente (com gráficos e páginas extras).
          </div>
        </div>

        <div className="a4-footer">
          <div className="a4-foot-muted">
            Compartilhe com fornecedores e família: use “Salvar em PDF” no botão acima.
          </div>
          <div className="a4-foot-mark">💕</div>
        </div>
      </div>
    </div>
  );
}

