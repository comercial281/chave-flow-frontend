import { useRef, useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@evoapi/design-system';
import { TooltipInfo } from '@/components/base/TooltipInfo';
import { motion, useInView, animate } from 'framer-motion';

type CardTone = 'good' | 'warning' | 'critical' | 'neutral';
type CardImportance = 'primary' | 'secondary';

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accentClassName: string;
  importance?: CardImportance;
  status?: { label: string; tone: CardTone };
  tooltip?: { title: string; content: string };
}

const toneClasses: Record<CardTone, string> = {
  good: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  warning: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
  neutral: 'bg-muted text-muted-foreground border-border',
};

function AnimatedNumber({ target, className }: { target: number; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, target, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1] as any,
      onUpdate(v: number) { setDisplayed(Math.round(v)); },
    });
    return () => controls.stop();
  }, [isInView, target]);

  return (
    <span ref={ref} className={className}>
      {displayed.toLocaleString('pt-BR')}
    </span>
  );
}

const DashboardMetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accentClassName,
  importance = 'secondary',
  status,
  tooltip,
}: DashboardMetricCardProps) => {
  const valueClassName = importance === 'primary' ? 'text-3xl font-semibold' : 'text-2xl font-semibold';
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d+$/.test(value.replace(/[.,\s]/g, ''))
      ? Number(value.replace(/[.,\s]/g, ''))
      : null;
  const isPrimary = importance === 'primary';

  return (
    <motion.div className="h-full" whileHover={{ y: -2, transition: { duration: 0.2 } }}>
      <Card
        className="h-full transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(124,58,237,0.25),0_4px_24px_rgba(124,58,237,0.08)]"
        style={isPrimary ? { borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.02)' } : undefined}
      >
        <CardHeader className="flex flex-row items-start justify-between pb-2 gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <span className="truncate">{title}</span>
              {tooltip && <TooltipInfo title={tooltip.title} content={tooltip.content} />}
            </CardTitle>
            {status && (
              <Badge variant="outline" className={`mt-2 ${toneClasses[status.tone]}`}>
                {status.label}
              </Badge>
            )}
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accentClassName}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          {numericValue !== null ? (
            <AnimatedNumber target={numericValue} className={valueClassName} />
          ) : (
            <div className={valueClassName}>{value}</div>
          )}
          {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardMetricCard;
