import { useEffect, useRef, useState } from 'react';
import { Building2, CalendarClock, FileSignature, ClipboardList, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { animate, useInView } from 'framer-motion';
import { propertiesService } from '@/services/properties/propertiesService';
import { visitsService } from '@/services/visits/visitsService';
import { proposalsService } from '@/services/proposals/proposalsService';
import { propertyCaptureRequestsService } from '@/services/propertyCaptureRequests/propertyCaptureRequestsService';

interface ImobStatMeta {
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  numColor: string;
  glowColor: string;
  href: string;
  description: string;
}

function CountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const c = animate(0, target, {
      duration: 1.0,
      ease: [0.22, 1, 0.36, 1] as any,
      onUpdate(n: number) { setV(Math.round(n)); },
    });
    return () => c.stop();
  }, [isInView, target]);

  return <span ref={ref}>{v}</span>;
}

const STATS_META: ImobStatMeta[] = [
  {
    label: 'Imóveis ativos',
    icon: Building2,
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
    numColor: 'text-violet-400',
    glowColor: 'rgba(124,58,237,0.18)',
    href: '/properties',
    description: 'Em carteira',
  },
  {
    label: 'Visitas hoje',
    icon: CalendarClock,
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    numColor: 'text-blue-400',
    glowColor: 'rgba(59,130,246,0.18)',
    href: '/visits',
    description: 'Agendadas para hoje',
  },
  {
    label: 'Propostas em aberto',
    icon: FileSignature,
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    numColor: 'text-orange-400',
    glowColor: 'rgba(249,115,22,0.18)',
    href: '/proposals',
    description: 'Aguardando resposta',
  },
  {
    label: 'Captações pendentes',
    icon: ClipboardList,
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    numColor: 'text-emerald-400',
    glowColor: 'rgba(16,185,129,0.18)',
    href: '/property-capture-requests',
    description: 'Aguardando análise',
  },
];

export default function ImobSummarySection() {
  const navigate = useNavigate();
  const [values, setValues] = useState<(number | null)[]>([null, null, null, null]);

  useEffect(() => {
    Promise.allSettled([
      propertiesService.list({ status: 'active', per_page: 1 }),
      visitsService.list({ today: 'true', per_page: 1 }),
      proposalsService.list({ status: 'sent', per_page: 1 }),
      propertyCaptureRequestsService.list({ status: 'pending_review' }),
    ]).then(([props, visits, proposals, captures]) => {
      setValues([
        props.status === 'fulfilled' ? (props.value.meta?.total ?? props.value.data?.length ?? 0) : 0,
        visits.status === 'fulfilled' ? (visits.value.meta?.total ?? visits.value.data?.length ?? 0) : 0,
        proposals.status === 'fulfilled' ? (proposals.value.meta?.total ?? proposals.value.data?.length ?? 0) : 0,
        captures.status === 'fulfilled' ? (captures.value.meta?.total ?? captures.value.data?.length ?? 0) : 0,
      ]);
    });
  }, []);

  return (
    <div
      className="rounded-2xl border p-5 relative overflow-hidden"
      style={{
        borderColor: 'rgba(124,58,237,0.15)',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(147,51,234,0.02) 50%, transparent 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(124,58,237,0.08)' }}
      />

      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-5 rounded-full"
            style={{ background: 'linear-gradient(to bottom, #7c3aed, #9333ea)' }}
          />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Portfólio Imobiliário
          </h2>
        </div>
        <Building2 className="h-4 w-4 text-violet-400/60" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {STATS_META.map((meta, i) => (
          <ImobCard
            key={i}
            meta={meta}
            value={values[i]}
            onClick={() => navigate(meta.href)}
          />
        ))}
      </div>
    </div>
  );
}

function ImobCard({
  meta,
  value,
  onClick,
}: {
  meta: ImobStatMeta;
  value: number | null;
  onClick: () => void;
}) {
  const Icon = meta.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col gap-3 rounded-xl border bg-card/60 p-4 text-left backdrop-blur-sm"
      style={{
        borderColor: hovered ? meta.glowColor.replace('0.18', '0.4') : 'rgba(255,255,255,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 8px 32px ${meta.glowColor}, 0 2px 8px rgba(0,0,0,0.2)`
          : '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${meta.iconBg}`}
          style={{
            boxShadow: hovered ? `0 0 16px ${meta.glowColor}` : 'none',
            transition: 'box-shadow 0.22s ease',
          }}
        >
          <Icon className={`h-4 w-4 ${meta.iconColor}`} />
        </div>
        <ArrowUpRight
          className="h-3.5 w-3.5 text-muted-foreground"
          style={{
            opacity: hovered ? 0.6 : 0,
            transform: hovered ? 'translate(1px,-1px)' : 'translate(0,0)',
            transition: 'all 0.15s ease',
          }}
        />
      </div>

      <div>
        <p className={`text-3xl font-bold tracking-tight leading-none ${meta.numColor}`}>
          {value === null ? (
            <span className="inline-block h-8 w-10 animate-pulse rounded-md bg-muted" />
          ) : (
            <CountUp target={value} />
          )}
        </p>
        <p className="text-sm font-medium text-foreground mt-1.5 leading-tight">{meta.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
      </div>
    </button>
  );
}
