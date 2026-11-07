import { Radar, Search, Ship, SlidersHorizontal } from 'lucide-react';
import { useEstimator } from '#estimator/store.ts';
import { vesselLabel } from '#features/vessel/VesselCandidate.ts';
import { counted, figure, stated, unitLabel } from '#shared/format.ts';
import type { Column } from '#shared/display.ts';
import { DataTable } from '#shared/ui/DataTable.tsx';
import { Alert } from '#shared/ui/Alert.tsx';
import { Button } from '#shared/ui/Button.tsx';
import { EmptyState } from '#shared/ui/EmptyState.tsx';
import { Fields } from '#shared/ui/Field.tsx';
import { ProgressNote } from '#shared/ui/ProgressNote.tsx';
import { Sheet, SheetNote, SheetSection } from '#shared/ui/Sheet.tsx';
import { exceedsDraftLimit, missingSearchFields, SEARCH_FIELDS, type ScreeningCriteria, type ScreeningResult, type SearchResult, type Shortlisted } from './vesselScreening.ts';

const CANDIDATE_COLUMNS: readonly Column<Shortlisted>[] = [
  { label: '#', emphasis: 'rank', text: (_candidate, index) => index + 1 },
  { label: 'Name', emphasis: 'key', text: ({ particulars }) => stated(particulars.name) },
  { label: 'IMO', text: ({ particulars }) => particulars.imo },
  { label: 'Type', text: ({ particulars }) => particulars.type },
  { label: 'Flag', text: ({ particulars }) => stated(particulars.flag) },
  { label: 'Built', text: ({ particulars }) => stated(particulars.builtYear) },
  { label: unitLabel('Deadweight', 'tonnes'), text: ({ particulars }) => figure(particulars.deadweight) },
  { label: unitLabel('Draught', 'm'), text: ({ particulars }) => figure(particulars.maxDraft, 1) },
  { label: unitLabel('Distance', 'nm'), text: ({ sighting }) => figure(sighting.distance, 1) },
  { label: unitLabel('Cargo Lifted', 'tonnes'), text: ({ fit }) => figure(fit.cargoLifted) },
];

function discardNotes({ failures, missing }: SearchResult, { tooSmall, tooLarge }: ScreeningResult) {
  const counts: [string, number][] = [
    ['Errors', failures],
    ['Missing Data', missing],
    ['Insufficient Capacity', tooSmall],
    ['Excessive Capacity', tooLarge],
  ];
  const notes = counts
    .filter(([, count]) => count > 0)
    .map(([label, count]) => <SheetNote key={label}>{`${label}: ${figure(count)}`}</SheetNote>);
  return notes.length > 0 ? notes : null;
}

function Candidates({ search, screening, criteria }: { search: SearchResult; screening: ScreeningResult; criteria: ScreeningCriteria }) {
  const { active, select } = useEstimator();
  const deepDrafted = screening.candidates.map(({ particulars }) => particulars).filter((particulars) => exceedsDraftLimit(particulars, criteria.draftLimit));
  return (
    <>
      <SheetSection
        title={counted(screening.candidates.length, 'Candidate')}
        icon={Ship}
        columns={1}
        note={discardNotes(search, screening)}
      >
        {screening.candidates.length === 0 ? (
          <EmptyState>No vessel passes the screening.</EmptyState>
        ) : (
          <DataTable
            columns={CANDIDATE_COLUMNS}
            rows={screening.candidates}
            rowKey={({ particulars }) => particulars.imo}
            selectedKey={active?.vessel.imo}
            onSelect={select}
          />
        )}
      </SheetSection>
      {deepDrafted.length > 0 && <Alert>{`Draught may exceed the port limit: ${deepDrafted.map(vesselLabel).join(', ')}.`}</Alert>}
    </>
  );
}

export function ScreeningSheet() {
  const { state, criteria, canSearch, search, searchProgress, screening, searching, patchSearchSettings, runSearch } = useEstimator();
  const missing = missingSearchFields(state.charterParty, state.searchSettings);

  return (
    <Sheet icon={Radar} title="Vessel Search" busy={searching}>
      <SheetSection title="Screening" icon={SlidersHorizontal} columns={3}>
        <Fields specs={SEARCH_FIELDS} model={state.searchSettings} patch={patchSearchSettings} />
        <Button fill icon={Search} busy={searching} disabled={!canSearch} onClick={runSearch}>
          {searching ? 'Identifying Candidates' : 'Identify Candidates'}
        </Button>
      </SheetSection>

      {missing.length > 0 && <Alert>{`Required fields: ${missing.join(', ')}.`}</Alert>}

      {searchProgress && <ProgressNote>{searchProgress}</ProgressNote>}

      {search.status === 'error' && <Alert>{search.error}</Alert>}

      {search.data && screening && criteria && <Candidates search={search.data} screening={screening} criteria={criteria} />}
    </Sheet>
  );
}
