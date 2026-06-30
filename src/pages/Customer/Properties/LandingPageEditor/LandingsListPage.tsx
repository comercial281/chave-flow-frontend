import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, Loader2, Megaphone, Plus, Trash2 } from 'lucide-react';
import {
  landingPageService,
  type LandingPageDTO,
} from '@/services/landingPages/landingPageService';
import { siteBuilderService } from '@/services/siteBuilder/siteBuilderService';

/** Manage ad landing pages: create blank ones (no property required) and edit. */
export default function LandingsListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [landings, setLandings] = useState<LandingPageDTO[]>([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const reload = async (sid: string) => {
    const list = await landingPageService.listLandings(sid);
    setLandings(list);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sites = await siteBuilderService.listSites();
        if (!active) return;
        if (!sites.length) {
          toast.error('Nenhum site configurado para este cliente.');
          setLoading(false);
          return;
        }
        setSiteId(sites[0].id);
        await reload(sites[0].id);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async () => {
    if (!siteId || !newName.trim()) return;
    setCreating(true);
    try {
      const lp = await landingPageService.createBlank(siteId, newName.trim());
      navigate(`/landings/${lp.dto.id}`);
    } catch {
      toast.error('Erro ao criar a landing page');
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!siteId) return;
    try {
      await siteBuilderService.deletePage(siteId, id);
      setLandings((prev) => prev.filter((l) => l.id !== id));
      toast.success('Landing excluída');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Landing Pages de anúncio</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Páginas para rodar anúncios. Crie do zero ou a partir de um imóvel (botão na lista de Imóveis).
      </p>

      {/* criar do zero */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Nome da nova landing (ex: Campanha Lançamento Setembro)"
          className="min-w-[260px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Nova landing do zero
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      ) : landings.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma landing ainda. Crie a primeira acima.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {landings.map((l) => (
            <div
              key={l.id}
              className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {l.property_id ? (
                    <>
                      <Building2 className="h-3 w-3" /> Do imóvel
                    </>
                  ) : (
                    <>
                      <Megaphone className="h-3 w-3" /> Avulsa
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(l.id)}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  title="Excluir landing"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/landings/${l.id}`)}
                className="flex-1 text-left"
              >
                <h3 className="line-clamp-2 text-sm font-medium">{l.title}</h3>
                <p className="mt-1 font-mono text-xs text-muted-foreground">/{l.slug}</p>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
