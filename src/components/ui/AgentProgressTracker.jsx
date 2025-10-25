'use client';

import { useMemo } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';

function normalizeProgressValue(progress) {
  if (progress == null) return 0;
  if (typeof progress === 'number' && Number.isFinite(progress)) {
    return Math.max(0, Math.min(100, progress));
  }
  const numeric = Number(progress);
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, numeric));
  }
  return 0;
}

export default function AgentProgressTracker({ isVisible, progress, onClose }) {
  const progressValue = useMemo(
    () => normalizeProgressValue(progress?.progress ?? progress?.completion),
    [progress]
  );
  const status = (progress?.status || progress?.state || '').toLowerCase();
  const isComplete = progressValue >= 100 || status === 'completed' || status === 'complete' || status === 'success';
  const executionId = useMemo(() => {
    if (!progress) return null;
    return (
      progress.executionId ||
      progress.execution_id ||
      progress.executionID ||
      progress.id ||
      progress.execution?.id ||
      progress.execution?.executionId ||
      null
    );
  }, [progress]);

  const agentName =
    progress?.agentName || progress?.name || progress?.phase || progress?.title || 'Storyline Generation';
  const statusLabel = status ? status.replace(/_/g, ' ') : 'In progress';

  if (!isVisible || isComplete) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl border-l border-gray-200 z-40 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Agent Progress</p>
          <h3 className="text-lg font-semibold text-gray-900">{agentName}</h3>
          {executionId && (
            <p className="text-xs text-gray-400">Execution ID: {executionId}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
          aria-label="Close progress tracker"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-700">
            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-sm font-medium">{statusLabel}</span>
          </div>
          <span className="text-sm text-gray-500 font-medium">{Math.round(progressValue)}%</span>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
          />
        </div>
        {progress?.message && (
          <p className="mt-2 text-xs text-gray-500">{progress.message}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="flex items-start space-x-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <Loader2 className="h-4 w-4 text-blue-500 mt-0.5 animate-spin" />
          <div>
            <p className="text-sm text-blue-900 font-medium">Generating storyline...</p>
            <p className="text-xs text-blue-700 mt-1">
              The agent is still running. This panel will close automatically once the execution is complete.
            </p>
            {executionId && (
              <p className="mt-2 text-[10px] text-blue-600 uppercase tracking-wide">
                Execution ID: {executionId}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
