import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Button, Input, Label as UILabel,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/ds';
import {
  Zap, RefreshCw, CheckCircle, Loader2, ChevronRight,
  Shuffle, Calendar, TrendingUp, Award, RefreshCcw,
} from 'lucide-react';
import {
  automationTemplatesService,
  AutomationTemplate,
  CATEGORY_LABELS,
} from '@/services/automationTemplates/automationTemplatesService';

const ICON_MAP: Record<string, React.ReactNode> = {
  zap:          <Zap className="h-5 w-5" />,
  shuffle:      <Shuffle className="h-5 w-5" />,
  'refresh-cw': <RefreshCw className="h-5 w-5" />,
  'trending-up':<TrendingUp className="h-5 w-5" />,
  award:        <Award className="h-5 w-5" />,
  calendar:     <Calendar className="h-5 w-5" />,
  'refresh-ccw':<RefreshCcw className="h-5 w-5" />,
};

interface ApplyModalState {
  template: AutomationTemplate;
  inboxId: string;
  applying: boolean;
  done: boolean;
  result: { rules: string[]; sequences: string[]; tags: string[] } | null;
}

function TemplateCard({
  template,
  onApply,
}: {
  template: AutomationTemplate;
  onApply: (t: AutomationTemplate) => void;
}) {
  return (
    <div className="border rounded-xl p-4 hover:shadow-md transition-shadow bg-card">
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
          style={{ backgroundColor: template.meta?.color ?? '#7c3aed' }}
        >
          {ICON_MAP[template.meta?.icon ?? 'zap'] ?? <Zap className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{template.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
          {template.meta?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.meta.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <Button
        size="sm"
        className="mt-3 w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white gap-1"
        onClick={() => onApply(template)}
      >
        Aplicar ao cliente
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function AutomationTemplatesPage() {
  const [templates, setTemplates]       = useState<AutomationTemplate[]>([]);
  const [loading, setLoading]           = useState(false);
  const [category, setCategory]         = useState('');
  const [applyState, setApplyState]     = useState<ApplyModalState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await automationTemplatesService.getAll(category || undefined));
    } catch {
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  function openApply(t: AutomationTemplate) {
    setApplyState({ template: t, inboxId: '', applying: false, done: false, result: null });
  }

  async function doApply() {
    if (!applyState) return;
    if (!applyState.inboxId.trim()) {
      toast.error('Informe o Inbox ID do cliente');
      return;
    }
    setApplyState(prev => prev ? { ...prev, applying: true } : null);
    try {
      const res = await automationTemplatesService.apply(applyState.template.id, applyState.inboxId);
      setApplyState(prev => prev ? {
        ...prev,
        applying: false,
        done: true,
        result: res.applied,
      } : null);
      toast.success('Template aplicado com sucesso!');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao aplicar template';
      toast.error(msg);
      setApplyState(prev => prev ? { ...prev, applying: false } : null);
    }
  }

  // Agrupar por categoria
  const byCategory = templates.reduce<Record<string, AutomationTemplate[]>>((acc, t) => {
    const cat = t.category ?? 'outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const categories = Object.keys(byCategory).sort((a, b) => {
    const order = ['recepcao', 'followup', 'funil', 'roleta', 'relatorio', 'chatbot', 'pos_venda'];
    return (order.indexOf(a) ?? 99) - (order.indexOf(b) ?? 99);
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#7c3aed]" />
            Biblioteca de Automacoes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Templates prontos para aplicar em qualquer cliente CRM com um clique.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas as categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando templates...
        </div>
      )}

      {!loading && templates.length === 0 && (
        <div className="border rounded-xl p-16 text-center text-muted-foreground">
          <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum template encontrado</p>
          <p className="text-sm mt-1">
            Execute <code className="bg-muted px-1 rounded">rails runner db/seeds/automation_templates.rb</code> no servidor para carregar os templates padrao.
          </p>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {CATEGORY_LABELS[cat] ?? cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {byCategory[cat].map(t => (
              <TemplateCard key={t.id} template={t} onApply={openApply} />
            ))}
          </div>
        </div>
      ))}

      {/* Modal de aplicacao */}
      <Dialog open={!!applyState} onOpenChange={open => { if (!open) setApplyState(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar template</DialogTitle>
          </DialogHeader>

          {applyState && !applyState.done && (
            <div className="space-y-4 py-2">
              <div className="border rounded-lg p-3 bg-muted/50">
                <p className="font-medium text-sm">{applyState.template.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{applyState.template.description}</p>
              </div>
              <div>
                <UILabel>Inbox ID do cliente *</UILabel>
                <Input
                  value={applyState.inboxId}
                  onChange={e => setApplyState(prev => prev ? { ...prev, inboxId: e.target.value } : null)}
                  placeholder="Ex: 12"
                  className="mt-1"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID numerico do inbox do cliente onde as automacoes serao criadas.
                  Deixe em branco para criar automacoes sem inbox especifico (disparo global).
                </p>
              </div>
            </div>
          )}

          {applyState?.done && applyState.result && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Template aplicado com sucesso!</span>
              </div>
              {applyState.result.tags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Etiquetas criadas:</p>
                  <p className="text-sm">{applyState.result.tags.join(', ')}</p>
                </div>
              )}
              {applyState.result.sequences.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Sequencias criadas:</p>
                  <p className="text-sm">{applyState.result.sequences.join(', ')}</p>
                </div>
              )}
              {applyState.result.rules.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Regras criadas:</p>
                  <ul className="text-sm space-y-0.5">
                    {applyState.result.rules.map(r => (
                      <li key={r} className="flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyState(null)}>
              {applyState?.done ? 'Fechar' : 'Cancelar'}
            </Button>
            {!applyState?.done && (
              <Button
                onClick={doApply}
                disabled={applyState?.applying}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white gap-2"
              >
                {applyState?.applying
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Aplicando...</>
                  : 'Aplicar agora'
                }
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
