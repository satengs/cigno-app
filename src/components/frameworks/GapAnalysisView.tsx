'use client';

import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { InsightsList } from './shared/InsightsList';
import { Takeaway } from './shared/Takeaway';
import { FrameworkComponentProps } from './types';

Chart.register(...registerables);

export function GapAnalysisView({ data, insights, takeaway, className = '' }: FrameworkComponentProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Generate colors based on gap magnitude
    const getGapColor = (value: number) => {
      if (value >= 7) return 'rgba(16, 185, 129, 0.8)'; // Green for strong
      if (value >= 4) return 'rgba(245, 158, 11, 0.8)'; // Yellow for medium
      return 'rgba(239, 68, 68, 0.8)'; // Red for weak
    };

    const getBorderColor = (value: number) => {
      if (value >= 7) return 'rgba(16, 185, 129, 1)';
      if (value >= 4) return 'rgba(245, 158, 11, 1)';
      return 'rgba(239, 68, 68, 1)';
    };

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels || [],
        datasets: data.datasets?.map((dataset) => ({
          ...dataset,
          backgroundColor: dataset.data.map(value => getGapColor(value)),
          borderColor: dataset.data.map(value => getBorderColor(value)),
          borderWidth: 2
        })) || []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Capability Gap Analysis',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            title: {
              display: true,
              text: 'Capability Score'
            },
            ticks: {
              callback: function(value) {
                if (value >= 7) return 'Strong';
                if (value >= 4) return 'Medium';
                return 'Weak';
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Capability Areas'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="h-64">
          <canvas ref={chartRef} />
        </div>
      </div>
      
      {insights && insights.length > 0 && (
        <InsightsList insights={insights} />
      )}
      
      {takeaway && (
        <Takeaway takeaway={takeaway} />
      )}
    </div>
  );
}
