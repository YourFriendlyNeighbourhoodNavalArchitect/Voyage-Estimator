import { BookOpen, Clock, Coins, Gauge, Package, Percent, Receipt, Target, TrendingUp, Wrench, type LucideIcon } from 'lucide-react';
import { useEstimator } from '#estimator/store.ts';
import { Alert } from '#shared/ui/Alert.tsx';
import { DataTable } from '#shared/ui/DataTable.tsx';
import { Sheet, SheetGrid, SheetNote, SheetSection } from '#shared/ui/Sheet.tsx';
import { StatTile } from '#shared/ui/StatTile.tsx';
import { blankWarning, deadweightAccount, ledger, LINE_COLUMNS, PASSAGE_COLUMNS, passages, type LedgerGroupId } from './ledger.ts';
import { headlines, type Headline } from './metrics.ts';

const HEADLINE_ICONS: Record<Headline, LucideIcon> = { timeCharterEquivalent: Gauge, netProfit: TrendingUp, margin: Percent, breakEvenRate: Target };

const GROUP_ICONS: Record<LedgerGroupId, LucideIcon> = { revenue: Coins, voyageExpenses: Receipt, runningCost: Wrench };

function Notes({ notes = [] }: { notes?: readonly string[] }) {
  return notes.map((note) => <SheetNote key={note}>{note}</SheetNote>);
}

export function LedgerSheet() {
  const estimate = useEstimator().active?.estimate;
  if (!estimate) return null;
  const plan = passages(estimate);
  const account = deadweightAccount(estimate);
  const warning = blankWarning(estimate);

  return (
    <Sheet icon={BookOpen} title="Voyage Ledger">
      <SheetGrid columns={4}>
        {headlines(estimate).map(({ id, ...tile }) => (
          <StatTile key={id} {...tile} icon={HEADLINE_ICONS[id]} boxed />
        ))}
      </SheetGrid>

      <SheetSection title={account.title} icon={Package} columns={4}>
        {account.rows.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </SheetSection>

      {ledger(estimate).map(({ id, title, rows, notes }) => (
        <SheetSection key={id} title={title} icon={GROUP_ICONS[id]} columns={1} note={<Notes notes={notes} />}>
          <DataTable columns={LINE_COLUMNS} rows={rows} rowKey={({ label }) => label} />
        </SheetSection>
      ))}

      <SheetSection title={plan.title} icon={Clock} columns={1} note={<Notes notes={plan.notes} />}>
        <DataTable columns={PASSAGE_COLUMNS} rows={plan.rows} rowKey={({ label }) => label} />
      </SheetSection>

      {warning && <Alert>{warning}</Alert>}
    </Sheet>
  );
}
