'use client';

import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { InsightsList } from './shared/InsightsList';
import { Takeaway } from './shared/Takeaway';
import { FrameworkComponentProps } from './types';

Chart.register(...registerables);

export function BuyVsBuildView({ data, insights, takeaway, className = '' }: FrameworkComponentProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels || ['Cost', 'Time', 'Risk', 'Control', 'Innovation'],
        datasets: [
          {
            label: 'Buy',
            data: data.datasets?.[0]?.data || [8, 9, 6, 4, 5],
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2
          },
          {
            label: 'Build',
            data: data.datasets?.[1]?.data || [4, 3, 8, 9, 8],
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Buy vs Build Analysis',
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
              text: 'Score'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Evaluation Criteria'
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
