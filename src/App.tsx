import { Ship } from 'lucide-react';
import { EstimatorContext, useEstimatorStore } from '#estimator/store.ts';
import { BunkerSheet } from '#features/bunkers/BunkerSheet.tsx';
import { CharterPartySheet } from '#features/charterparty/CharterPartySheet.tsx';
import { LedgerSheet } from '#features/financials/LedgerSheet.tsx';
import { ReportDownload } from '#features/financials/ReportDownload.tsx';
import { SensitivitySheet } from '#features/financials/SensitivitySheet.tsx';
import { WaterfallSheet } from '#features/financials/WaterfallSheet.tsx';
import { RoutingSheet } from '#features/routing/RoutingSheet.tsx';
import { ScreeningSheet } from '#features/screening/ScreeningSheet.tsx';
import { VesselSheet } from '#features/vessel/VesselSheet.tsx';

export function App() {
  return (
    <EstimatorContext value={useEstimatorStore()}>
      <header className="bg-navy-900 border-b border-gold-500/30 sticky top-0 z-30 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-panel bg-gold-500/10 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Ship className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink-0">Voyage Estimator</h1>
          </div>
          <ReportDownload />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <CharterPartySheet />
        <ScreeningSheet />
        <VesselSheet />
        <RoutingSheet />
        <BunkerSheet />
        <LedgerSheet />
        <WaterfallSheet />
        <SensitivitySheet />
      </main>
    </EstimatorContext>
  );
}
