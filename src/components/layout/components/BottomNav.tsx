import { Link, useLocation } from 'react-router-dom';
import { PieChart, MessageSquare, SquareKanban, Contact, MoreHorizontal, LucideIcon } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface BottomNavProps {
  onOpenMore: () => void;
}

interface NavItem {
  href?: string;
  icon: LucideIcon;
  label: string;
  matchPrefix?: string;
  isMore?: boolean;
}

export default function BottomNav({ onOpenMore }: BottomNavProps) {
  const { t } = useLanguage('layout');
  const { pathname } = useLocation();

  const items: NavItem[] = [
    {
      href: '/dashboard',
      icon: PieChart,
      label: t('menu.customer.dashboard') || 'Início',
      matchPrefix: '/dashboard',
    },
    {
      href: '/conversations',
      icon: MessageSquare,
      label: t('menu.customer.conversations') || 'Chat',
      matchPrefix: '/conversations',
    },
    {
      href: '/pipelines',
      icon: SquareKanban,
      label: t('menu.customer.pipelines') || 'Pipeline',
      matchPrefix: '/pipelines',
    },
    {
      href: '/contacts',
      icon: Contact,
      label: t('menu.customer.contacts') || 'Contatos',
      matchPrefix: '/contacts',
    },
    {
      isMore: true,
      icon: MoreHorizontal,
      label: t('sidebar.more') || 'Mais',
    },
  ];

  const isActive = (item: NavItem) => {
    if (!item.matchPrefix) return false;
    return pathname === item.matchPrefix || pathname.startsWith(item.matchPrefix + '/');
  };

  return (
    <nav
      className={cn(
        'md:hidden',
        'fixed bottom-0 inset-x-0 z-40',
        'bg-sidebar border-t border-sidebar-border',
        'pb-safe',
      )}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="grid grid-cols-5 h-16">
        {items.map(item => {
          const active = isActive(item);
          const Icon = item.icon;

          const baseClasses = cn(
            'flex flex-col items-center justify-center gap-1',
            'touch-target',
            'transition-colors duration-150',
            active
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground active:bg-sidebar-accent/50',
          );

          if (item.isMore) {
            return (
              <button
                key="more"
                type="button"
                onClick={onOpenMore}
                className={cn(baseClasses, 'cursor-pointer')}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              to={item.href!}
              className={baseClasses}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
