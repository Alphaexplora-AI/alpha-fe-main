import { Skeleton, SkeletonConversation, SkeletonRegion, SkeletonTable } from '@/shared/components/ui/skeleton';

/** The ticket context column: section tabs, then label / value fields. Shown from large screens up, like the real panel. */
function TicketContextSkeleton() {
  return <div data-skeleton="ticket-context" className="hidden space-y-5 border-l border-divider pl-5 lg:block">
    <div className="flex flex-wrap gap-2">{[0, 1, 2, 3].map(index => <Skeleton key={index} className="h-6 w-20 rounded-md" />)}</div>
    {[0, 1, 2, 3, 4].map(index => <div key={index} className="space-y-1.5">
      <Skeleton className="h-2 w-16" /><Skeleton className={index % 2 ? 'h-3 w-1/2' : 'h-3 w-3/4'} />
    </div>)}
  </div>;
}

/** The client request progress line: five steps joined by a rule. */
function ProgressSkeleton() {
  return <div data-skeleton="progress" className="flex items-start justify-between gap-2 border-b border-divider py-4">
    {[0, 1, 2, 3, 4].map(index => <div key={index} className="flex flex-1 flex-col items-center gap-2">
      <Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="hidden h-2 w-16 sm:block" />
    </div>)}
  </div>;
}

/** Ticket or request detail while it loads: identity line and title, then the conversation and the context column. */
export function TicketDetailSkeleton({ label, context = true, stepper = false, className = 'p-5' }: {
  label: string; context?: boolean; stepper?: boolean; className?: string;
}) {
  return <SkeletonRegion label={label} className={className}>
    <div className="flex items-start gap-3 border-b border-divider pb-4">
      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex gap-2"><Skeleton className="h-2.5 w-24" /><Skeleton className="h-2.5 w-16" /></div>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-2.5 w-40" />
      </div>
    </div>
    {stepper && <ProgressSkeleton />}
    <div className={context ? 'grid gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_18rem]' : 'pt-5'}>
      <SkeletonConversation messages={3} composer className="mx-auto w-full max-w-3xl" />
      {context && <TicketContextSkeleton />}
    </div>
  </SkeletonRegion>;
}

/** A phone-width queue row: the real queue stacks title, reference, client, status and next step. */
function QueueCardRow({ index }: { index: number }) {
  return <div data-skeleton="queue-card" className="flex min-h-[158px] gap-3 border-b border-divider py-4">
    <div className="min-w-0 flex-1 space-y-2.5">
      <Skeleton className={index % 2 ? 'h-4 w-3/5' : 'h-4 w-4/5'} />
      <Skeleton className="h-2 w-16" />
      <Skeleton className="h-2.5 w-2/5" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-2 w-1/2" />
    </div>
    <Skeleton className="h-2.5 w-9 shrink-0" />
  </div>;
}

/** Ticket queue: a column-header table at md and up (rows as tall as the real two-line rows), stacked rows on phones. */
export function TicketQueueSkeleton({ label, rows = 5, className }: { label: string; rows?: number; className?: string }) {
  return <SkeletonRegion label={label} className={className}>
    <SkeletonTable rows={rows} columns={4} header className="hidden md:block [&_[data-skeleton=table-row]:first-child]:min-h-[42px] [&_[data-skeleton=table-row]:not(:first-child)]:min-h-[98px]" />
    <div className="md:hidden">{Array.from({ length: rows }, (_, index) => <QueueCardRow key={index} index={index} />)}</div>
  </SkeletonRegion>;
}
