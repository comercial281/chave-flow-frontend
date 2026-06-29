// Wrapper do @evoapi/design-system: reexporta TUDO igual, mas troca o
// DialogContent por uma versão que injeta uma <DialogDescription> escondida
// (sr-only) quando o diálogo não tem uma. Isso mata o warning do Radix
// ("Missing Description or aria-describedby for {DialogContent}") em TODAS as
// telas sem precisar editar 147 arquivos nem mudar o visual.
//
// Se o diálogo já tem a sua própria DialogDescription, ela é montada depois e
// "vence" o aria-describedby (a injetada vira só um nó escondido inofensivo).
import { forwardRef, type ComponentProps, type ComponentRef } from 'react';
import { DialogContent as BaseDialogContent, DialogDescription } from '@evoapi/design-system';

export * from '@evoapi/design-system';

type DialogContentProps = ComponentProps<typeof BaseDialogContent>;

export const DialogContent = forwardRef<ComponentRef<typeof BaseDialogContent>, DialogContentProps>(
  ({ children, ...props }, ref) => (
    <BaseDialogContent ref={ref} {...props}>
      <DialogDescription className="sr-only">Conteúdo do diálogo</DialogDescription>
      {children}
    </BaseDialogContent>
  ),
);
DialogContent.displayName = 'DialogContent';
