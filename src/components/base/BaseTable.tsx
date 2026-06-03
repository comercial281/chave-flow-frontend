import { ReactNode } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Checkbox,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@evoapi/design-system';
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, LucideIcon } from 'lucide-react';
import EmptyState from './EmptyState';

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => ReactNode;
}

export interface TableAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  show?: (item: T) => boolean;
  variant?: 'default' | 'destructive';
}

export interface BaseTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
    disabled?: boolean;
    tooltip?: string;
  };
  getRowKey: (item: T) => string | number;
  className?: string;
}

export default function BaseTable<T extends Record<string, any>>({
  data,
  columns,
  actions,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  sortBy,
  sortOrder,
  onSort,
  loading = false,
  emptyMessage,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  getRowKey,
  className = '',
}: BaseTableProps<T>) {
  const { t } = useLanguage('common');
  const message = emptyMessage || t('base.table.emptyMessage');
  const isAllSelected = data.length > 0 && selectedItems.length === data.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data);
    }
  };

  const handleSelectItem = (item: T) => {
    const key = getRowKey(item);
    const isSelected = selectedItems.some(selected => getRowKey(selected) === key);

    if (isSelected) {
      onSelectionChange?.(selectedItems.filter(selected => getRowKey(selected) !== key));
    } else {
      onSelectionChange?.([...selectedItems, item]);
    }
  };

  const isItemSelected = (item: T) => {
    const key = getRowKey(item);
    return selectedItems.some(selected => getRowKey(selected) === key);
  };

  const renderSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return null;

    if (sortBy !== column.key) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-8 px-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => onSort(column.key)}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className="ml-2 h-8 px-2 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={() => onSort(column.key)}
      >
        {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      </Button>
    );
  };

  const renderCellContent = (item: T, column: TableColumn<T>, index: number) => {
    if (column.render) {
      return column.render(item, index);
    }

    const value = item[column.key];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? t('base.table.yes') : t('base.table.no');
    return String(value);
  };

  const renderActions = (item: T) => {
    if (!actions || actions.length === 0) return null;

    const visibleActions = actions.filter(action => !action.show || action.show(item));

    if (visibleActions.length === 0) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-sidebar border-sidebar-border text-sidebar-foreground"
        >
          {visibleActions.map((action, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => action.onClick(item)}
              className={`hover:bg-sidebar-accent ${
                action.variant === 'destructive' ? 'text-red-400' : 'text-sidebar-foreground'
              }`}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-sidebar rounded-lg border border-sidebar-border">
        <div className="text-sidebar-foreground/70">{t('base.table.loading')}</div>
      </div>
    );
  }

  if (data.length === 0) {
    // Se temos configuração completa do EmptyState, use o componente
    if (emptyIcon && emptyTitle && emptyDescription) {
      return (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          className="py-12"
        />
      );
    }

    // Fallback para a mensagem simples
    return (
      <div className="flex items-center justify-center py-12 bg-sidebar rounded-lg border border-sidebar-border">
        <div className="text-sidebar-foreground/70">{message}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mobile: cards stack */}
      <div className="md:hidden space-y-2">
        {data.map((item, index) => {
          const key = getRowKey(item);
          const isSelected = isItemSelected(item);
          const labelColumn = columns[0];
          const restColumns = columns.slice(1);
          return (
            <div
              key={key}
              className={`rounded-lg border border-sidebar-border bg-sidebar p-3 ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  {selectable && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectItem(item)}
                      aria-label={t('base.table.selectItem', { key })}
                      className="border-sidebar-border data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5 flex-shrink-0"
                    />
                  )}
                  <div className="text-sidebar-foreground font-semibold text-sm min-w-0 break-words">
                    {renderCellContent(item, labelColumn, index)}
                  </div>
                </div>
                {actions && actions.length > 0 && (
                  <div className="flex-shrink-0">{renderActions(item)}</div>
                )}
              </div>
              {restColumns.length > 0 && (
                <div className="space-y-1 pl-0 pt-2 border-t border-sidebar-border/40">
                  {restColumns.map(column => (
                    <div key={column.key} className="flex justify-between items-start gap-3 text-xs">
                      <span className="text-sidebar-foreground/60 flex-shrink-0">{column.label}</span>
                      <span className="text-sidebar-foreground text-right min-w-0 break-words">
                        {renderCellContent(item, column, index)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: tabela tradicional */}
      <div className="hidden md:block rounded-lg border border-sidebar-border bg-sidebar overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-sidebar-border hover:bg-sidebar-accent/50">
            {selectable && (
              <TableHead className="w-12 text-sidebar-foreground bg-sidebar-accent/30">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label={t('base.table.selectAll')}
                  className="border-sidebar-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </TableHead>
            )}
            {columns.map(column => (
              <TableHead
                key={column.key}
                className={`${column.width} text-sidebar-foreground bg-sidebar-accent/30 font-medium`}
                align={column.align}
              >
                <div className="flex items-center">
                  {column.label}
                  {renderSortIcon(column)}
                </div>
              </TableHead>
            ))}
            {actions && actions.length > 0 && (
              <TableHead className="w-12 text-sidebar-foreground bg-sidebar-accent/30">
                {t('base.table.actions')}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const key = getRowKey(item);
            const isSelected = isItemSelected(item);

            return (
              <TableRow
                key={key}
                className={`border-sidebar-border hover:bg-sidebar-accent/30 ${
                  isSelected ? 'bg-sidebar-accent/40' : ''
                }`}
              >
                {selectable && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectItem(item)}
                      aria-label={t('base.table.selectItem', { key })}
                      className="border-sidebar-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </TableCell>
                )}
                {columns.map(column => (
                  <TableCell
                    key={column.key}
                    align={column.align}
                    className="text-sidebar-foreground"
                  >
                    {renderCellContent(item, column, index)}
                  </TableCell>
                ))}
                {actions && actions.length > 0 && <TableCell>{renderActions(item)}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
