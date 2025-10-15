'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';

// Register chart.js components once
if (!ChartJS.registry.plugins.get('legend')) {
  ChartJS.register(...registerables);
}

const buildChartConfig = (chart = {}) => {
  const config = chart?.config;

  if (config && typeof config === 'object' && config.type && config.data) {
    return {
      type: config.type,
      data: config.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          title: config.options?.plugins?.title || {
            display: !!chart.title,
            text: chart.title
          }
        },
        ...config.options
      }
    };
  }

  return {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [
        {
          label: chart.title || 'Sample Data',
          data: [30, 45, 25],
          backgroundColor: ['#3b82f6', '#22c55e', '#f97316']
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        title: {
          display: !!chart.title,
          text: chart.title || 'Preview Chart'
        }
      }
    }
  };
};

const ChartPreview = ({ chart }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  const config = useMemo(() => buildChartConfig(chart), [chart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    try {
      chartInstance.current = new ChartJS(canvas, config);
    } catch (error) {
      console.warn('[ChartPreview] Failed to instantiate chart:', error);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [config]);

  return (
    <div className="relative rounded-md border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {chart?.title || 'Chart'}
          </p>
          {chart?.caption && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{chart.caption}</p>
          )}
        </div>
        {chart?.source && (
          <span className="ml-3 text-[11px] text-gray-400">{chart.source}</span>
        )}
      </div>
      <div className="relative h-52">
        <canvas ref={canvasRef} role="img" aria-label={chart?.title || 'Chart preview'} />
      </div>
    </div>
  );
};

export default ChartPreview;
