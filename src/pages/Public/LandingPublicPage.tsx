import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BlockRenderer,
  safeParsePageBlocks,
  type BlockInstance,
  type LandingProperty,
  type LandingTheme,
} from '@/features/landing/blocks';

interface PublicLandingDTO {
  title: string;
  theme?: Partial<LandingTheme> | null;
  content_blocks: unknown[];
  property?: {
    code: string;
    title: string;
    description?: string;
    stage?: LandingProperty['stage'];
    sale_price?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    suites?: number | null;
    parking_spaces?: number | null;
    useful_area_m2?: number | null;
    total_area_m2?: number | null;
    address_neighborhood?: string;
    address_city?: string;
    address_state?: string;
    latitude?: number | null;
    longitude?: number | null;
    responsible_name?: string;
    photos?: Array<{ file_url: string; thumbnail_url?: string | null; caption?: string | null; alt_text?: string | null; is_cover?: boolean }>;
  } | null;
}

function toProperty(p: PublicLandingDTO['property']): LandingProperty | null {
  if (!p) return null;
  return {
    code: p.code,
    title: p.title,
    description: p.description,
    stage: p.stage,
    salePrice: p.sale_price ?? null,
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    suites: p.suites ?? null,
    parkingSpaces: p.parking_spaces ?? null,
    usefulAreaM2: p.useful_area_m2 ?? null,
    totalAreaM2: p.total_area_m2 ?? null,
    neighborhood: p.address_neighborhood,
    city: p.address_city,
    state: p.address_state,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    responsibleName: p.responsible_name,
    photos: (p.photos ?? []).map((ph) => ({
      url: ph.file_url,
      thumbnailUrl: ph.thumbnail_url ?? undefined,
      caption: ph.caption ?? undefined,
      alt: ph.alt_text ?? undefined,
      isCover: ph.is_cover,
    })),
  };
}

/** Public, no-auth view of a published ad landing. Hosted by Leal Mídia
 *  (no client domain needed). NOINDEX. Tenant comes from the URL. */
export default function LandingPublicPage() {
  const { tenant, slug } = useParams<{ tenant: string; slug: string }>();
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');
  const [blocks, setBlocks] = useState<BlockInstance[]>([]);
  const [theme, setTheme] = useState<Partial<LandingTheme>>({});
  const [property, setProperty] = useState<LandingProperty | null>(null);

  // noindex — nunca indexar landing de anúncio.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!tenant || !slug) return;
      try {
        const base = import.meta.env.VITE_API_URL as string;
        const res = await fetch(`${base}/api/public/v1/landing/${encodeURIComponent(slug)}`, {
          headers: { 'X-Tenant': tenant },
        });
        if (!res.ok) {
          if (active) setState('notfound');
          return;
        }
        const json = (await res.json()) as { data: PublicLandingDTO };
        const dto = json.data;
        if (!active) return;
        setBlocks(safeParsePageBlocks(dto.content_blocks));
        setTheme(dto.theme ?? {});
        setProperty(toProperty(dto.property));
        document.title = dto.title || 'Landing';
        setState('ok');
      } catch {
        if (active) setState('notfound');
      }
    })();
    return () => {
      active = false;
    };
  }, [tenant, slug]);

  if (state === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-[#0F0520] text-neutral-400">Carregando…</div>;
  }
  if (state === 'notfound') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0520] px-6 text-center text-neutral-400">
        Esta página não está disponível.
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BlockRenderer blocks={blocks} property={property} theme={theme} />
    </div>
  );
}
