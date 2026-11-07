import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { useEstimator } from '#estimator/store.ts';
import { vesselLabel } from '#features/vessel/VesselCandidate.ts';
import { Alert } from '#shared/ui/Alert.tsx';
import { Button } from '#shared/ui/Button.tsx';
import type { VoyageEstimate } from './VoyageEstimate.ts';

const REPORT_FAILURE = 'The report could not be produced.';

const DOWNLOAD_GRACE_MS = 60_000;

type Status = 'idle' | 'busy' | 'failed';

function loadPdfRenderer() {
  return Promise.all([import('@react-pdf/renderer'), import('./VoyageReport.tsx')]);
}

async function saveReport(estimate: VoyageEstimate): Promise<void> {
  const [{ pdf }, { VoyageReport }] = await loadPdfRenderer();
  const url = URL.createObjectURL(await pdf(<VoyageReport estimate={estimate} />).toBlob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `${vesselLabel(estimate.inputs.vessel).replace(/[^\w-]+/g, '-')}-estimate.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_GRACE_MS);
}

export function ReportDownload() {
  const estimate = useEstimator().active?.estimate;
  const [status, setStatus] = useState<Status>('idle');

  const download = async (subject: VoyageEstimate) => {
    setStatus('busy');
    try {
      await saveReport(subject);
      setStatus('idle');
    } catch (cause) {
      console.error(`${REPORT_FAILURE} The cause follows.`, cause);
      setStatus('failed');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {status === 'failed' && <Alert>{REPORT_FAILURE}</Alert>}
      <Button icon={FileDown} busy={status === 'busy'} onClick={estimate ? () => void download(estimate) : undefined}>
        {status === 'busy' ? 'Building Report' : 'Download Report'}
      </Button>
    </div>
  );
}
