import React, { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex items-center justify-between gap-3 transition-all print:hidden">
      <div className="flex items-center gap-2.5 max-w-7xl mx-auto flex-1">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="font-semibold text-amber-950 flex-shrink-0">
          Clinical Decision Support Prototype:
        </span>
        <span className="text-amber-800 line-clamp-1 sm:line-clamp-none">
          CardioNexus 3D predictions are for decision-support and educational research purposes only. Predictions are not a formal clinical diagnosis and must not replace professional judgment or invasive diagnostic catheterization.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-700 hover:text-amber-950 p-1 rounded-md hover:bg-amber-100 transition-colors"
        title="Dismiss banner"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
