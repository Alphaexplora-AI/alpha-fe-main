import * as React from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Skeleton loading primitives.
 *
 * Every bar is decorative (`aria-hidden`). A loading region announces itself
 * once through `SkeletonRegion` (or the `label` prop on a composite), which
 * sets `aria-busy` and renders a single visually hidden status label.
 * The pulse only runs for `motion-safe` users; with reduced motion the bars
 * are static blocks. Colours come from theme tokens, so every theme works.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={twMerge('motion-safe:animate-pulse rounded-md bg-surface-high/70', className)} {...props} />;
}

/** Wraps skeleton content: `aria-busy` region, one hidden status label, decorative children. */
export function SkeletonRegion({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div aria-busy="true" className={className}>
    {label && <span role="status" className="sr-only">{label}</span>}
    <div aria-hidden="true">{children}</div>
  </div>;
}

/** Announces through a region only when a label is given; otherwise renders the bars bare for composition. */
function Labelled({ label, className, children }: { label?: string; className?: string; children: React.ReactNode }) {
  if (label === undefined) return <div aria-hidden="true" className={className}>{children}</div>;
  return <SkeletonRegion label={label} className={className}>{children}</SkeletonRegion>;
}

const lineWidths = ['w-11/12', 'w-4/5', 'w-full', 'w-3/4', 'w-5/6'];

/** Paragraph-like text lines; the last line is shorter, like real prose. */
export function SkeletonText({ lines = 3, label, className }: { lines?: number; label?: string; className?: string }) {
  return <Labelled label={label} className={twMerge('space-y-2', className)}>
    {Array.from({ length: lines }, (_, index) => (
      <Skeleton key={index} className={twMerge('h-2.5', index === lines - 1 && lines > 1 ? 'w-3/5' : lineWidths[index % lineWidths.length])} />
    ))}
  </Labelled>;
}

const cellWidths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-2/5', 'w-1/3'];

function TableCell({ first, width, avatar }: { first: boolean; width: string; avatar: boolean }) {
  const lines = <div className="min-w-0 flex-1 space-y-1.5">
    <Skeleton className={twMerge('h-2.5', width)} />
    {first && <Skeleton className="h-2 w-1/3" />}
  </div>;
  if (!first || !avatar) return lines;
  return <div className="flex min-w-0 items-center gap-2.5"><Skeleton className="h-8 w-8 shrink-0 rounded-full" />{lines}</div>;
}

function TableRow({ columns, index, header, avatar = false }: { columns: number; index: number; header?: boolean; avatar?: boolean }) {
  return <div data-skeleton="table-row" className={twMerge('grid min-h-12 items-center gap-4 border-b border-divider', header && 'min-h-9')}
    style={{ gridTemplateColumns: `2fr repeat(${Math.max(columns - 1, 0)}, minmax(0, 1fr))` }}>
    {Array.from({ length: columns }, (_, column) => header
      ? <Skeleton key={column} className="h-2 w-1/3" />
      : <TableCell key={column} first={column === 0} avatar={avatar} width={cellWidths[(index + column) % cellWidths.length]} />)}
  </div>;
}

/** Table rows with an optional column header row and a leading avatar. */
export function SkeletonTable({ rows = 5, columns = 3, header = false, avatar = false, label, className }: {
  rows?: number; columns?: number; header?: boolean; avatar?: boolean; label?: string; className?: string;
}) {
  return <Labelled label={label} className={className}>
    {header && <TableRow columns={columns} index={0} header />}
    {Array.from({ length: rows }, (_, index) => <TableRow key={index} columns={columns} index={index} avatar={avatar} />)}
  </Labelled>;
}

function ListRow({ index, avatar, card }: { index: number; avatar: boolean; card: boolean }) {
  return <div data-skeleton="list-row" className={card ? 'flex items-start gap-3 rounded-xl border border-divider bg-surface-raised p-4' : 'flex min-h-14 items-center gap-3 border-b border-divider'}>
    {avatar && <Skeleton className={card ? 'h-9 w-9 shrink-0 rounded-lg' : 'h-8 w-8 shrink-0'} />}
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className={twMerge('h-3', index % 2 === 0 ? 'w-3/5' : 'w-2/5')} />
      <Skeleton className="h-2 w-1/3" />
      {card && <Skeleton className="h-2 w-4/5" />}
    </div>
    <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
  </div>;
}

/** List rows (divided) or cards (bordered, gapped). */
export function SkeletonList({ rows = 3, variant = 'row', avatar = true, label, className }: {
  rows?: number; variant?: 'row' | 'card'; avatar?: boolean; label?: string; className?: string;
}) {
  const card = variant === 'card';
  return <Labelled label={label} className={twMerge(card && 'grid gap-3', className)}>
    {Array.from({ length: rows }, (_, index) => <ListRow key={index} index={index} avatar={avatar} card={card} />)}
  </Labelled>;
}

/** Page or panel header: title, subtitle, optional action buttons and tabs. */
export function SkeletonPageHeader({ actions = 1, tabs = 0, subtitle = true, label, className }: {
  actions?: number; tabs?: number; subtitle?: boolean; label?: string; className?: string;
}) {
  return <Labelled label={label} className={twMerge('space-y-4', className)}>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-48 max-w-full" />
        {subtitle && <Skeleton className="h-2.5 w-72 max-w-full" />}
      </div>
      {actions > 0 && <div className="flex shrink-0 gap-2">
        {Array.from({ length: actions }, (_, index) => <Skeleton key={index} className="h-8 w-20 rounded-lg" />)}
      </div>}
    </div>
    {tabs > 0 && <div className="flex gap-5 border-b border-divider pb-2">
      {Array.from({ length: tabs }, (_, index) => <Skeleton key={index} className="h-3 w-16" />)}
    </div>}
  </Labelled>;
}

/** Row of KPI tiles: a small label over a large value. */
export function SkeletonStats({ count = 4, label, className }: { count?: number; label?: string; className?: string }) {
  return <Labelled label={label} className={twMerge('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} data-skeleton="stat" className="space-y-2.5 rounded-xl border border-divider bg-surface-raised p-4">
        <Skeleton className="h-2 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    ))}
  </Labelled>;
}

/** Detail view: header, body text and blocks, with an optional side column (stacks on narrow screens). */
export function SkeletonDetail({ aside = true, label, className }: { aside?: boolean; label?: string; className?: string }) {
  return <Labelled label={label} className={twMerge('space-y-5', className)}>
    <SkeletonPageHeader actions={1} />
    <div className={twMerge('grid gap-5', aside && 'md:grid-cols-[minmax(0,1fr)_16rem]')}>
      <div className="min-w-0 space-y-5">
        <SkeletonText lines={4} />
        <Skeleton className="h-28 w-full rounded-xl" />
        <SkeletonText lines={2} />
      </div>
      {aside && <div data-skeleton="aside" className="space-y-4 rounded-xl border border-divider p-4">
        {[0, 1, 2, 3].map(index => <div key={index} className="space-y-1.5">
          <Skeleton className="h-2 w-1/3" /><Skeleton className="h-3 w-2/3" />
        </div>)}
      </div>}
    </div>
  </Labelled>;
}

function MessageRow({ index }: { index: number }) {
  const mine = index % 2 === 1;
  return <div data-skeleton="message" className={twMerge('flex items-end gap-2.5', mine && 'flex-row-reverse')}>
    <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
    <div className={twMerge('flex min-w-0 flex-1 flex-col gap-1.5', mine && 'items-end')}>
      <Skeleton className="h-2 w-20" />
      <Skeleton className={twMerge('h-11 rounded-xl', ['w-3/5', 'w-1/2', 'w-2/3'][index % 3])} />
    </div>
  </div>;
}

/** Chat thread: alternating message bubbles, with an optional composer box. */
export function SkeletonConversation({ messages = 3, composer = false, label, className }: {
  messages?: number; composer?: boolean; label?: string; className?: string;
}) {
  return <Labelled label={label} className={twMerge('flex flex-col gap-4', className)}>
    {Array.from({ length: messages }, (_, index) => <MessageRow key={index} index={index} />)}
    {composer && <Skeleton className="mt-2 h-20 w-full rounded-xl" />}
  </Labelled>;
}

const rowLayouts = {
  list: 'flex min-h-14 items-center gap-3 border-b border-divider',
  table: 'grid min-h-12 grid-cols-[2fr_1fr_1fr] items-center gap-4 border-b border-divider',
  detail: 'grid min-h-16 content-center gap-2',
  conversation: 'flex min-h-16 items-center gap-3',
  code: 'flex h-6 items-center gap-4 font-mono',
} as const;

function LoadingRow({ index, layout }: { index: number; layout: keyof typeof rowLayouts }) {
  return <div className={rowLayouts[layout]}>
    {(layout === 'list' || layout === 'conversation') && <Skeleton className="h-8 w-8 shrink-0" />}
    {layout === 'code' && <Skeleton className="h-2 w-4 shrink-0" />}
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className={index % 2 === 0 ? 'h-3 w-3/5' : 'h-3 w-2/5'} />
      {layout !== 'code' && <Skeleton className="h-2 w-1/3" />}
    </div>
    {layout === 'table' && <><Skeleton className="h-2.5 w-2/3" /><Skeleton className="h-2.5 w-1/2 justify-self-end" /></>}
  </div>;
}

/** Compact generic rows for small panels; prefer the shaped primitives above for page content. */
export function LoadingRows({ label, rows = 3, layout = 'list', className }: {
  label: string;
  rows?: number;
  layout?: keyof typeof rowLayouts;
  className?: string;
}) {
  return <SkeletonRegion label={label} className={className}>
    {Array.from({ length: rows }, (_, index) => <LoadingRow key={index} index={index} layout={layout} />)}
  </SkeletonRegion>;
}

export function EntrySkeleton({ label }: { label: string }) {
  return <main className="grid min-h-dvh place-items-center bg-canvas p-6">
    <div role="status" className="flex flex-col items-center gap-5">
      <img src={`${import.meta.env.BASE_URL}alpha-loading.svg`} alt="" className="h-20 w-20 object-contain" />
      <span className="text-sm text-content-muted">{label}</span>
    </div>
  </main>;
}
