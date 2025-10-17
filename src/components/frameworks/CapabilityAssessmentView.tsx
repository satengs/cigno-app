'use client';

import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { InsightsList } from './shared/InsightsList';
import { Takeaway } from './shared/Takeaway';
import { FrameworkComponentProps } from './types';

Chart.register(...registerables);

export function CapabilityAssessmentView({ data, insights, takeaway, className = '' }: FrameworkComponentProps) {
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
      type: 'radar',
      data: {
        labels: data.labels || [],
        datasets: data.datasets?.map((dataset, index) => ({
          ...dataset,
          backgroundColor: [
            'rgba(59, 130, 246, 0.2)',
            'rgba(16, 185, 129, 0.2)',
            'rgba(245, 158, 11, 0.2)',
            'rgba(239, 68, 68, 0.2)',
            'rgba(139, 92, 246, 0.2)'
          ][index % 5],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(139, 92, 246, 1)'
          ][index % 5],
          borderWidth: 2
        })) || []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Capability Assessment',
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
          r: {
            beginAtZero: true,
            min: 0,
            max: 10
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
