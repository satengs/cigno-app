'use client';

import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { InsightsList } from './shared/InsightsList';
import { Takeaway } from './shared/Takeaway';
import { FrameworkComponentProps } from './types';

Chart.register(...registerables);

export function StrategicOptionsView({ data, insights, takeaway, className = '' }: FrameworkComponentProps) {
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

    // Check if we have impact/feasibility data for bubble chart
    const hasBubbleData = data.datasets?.some(dataset => 
      dataset.data && Array.isArray(dataset.data) && 
      dataset.data.length > 0 && typeof dataset.data[0] === 'object'
    );

    if (hasBubbleData) {
      // Render bubble chart
      chartInstance.current = new Chart(ctx, {
        type: 'bubble',
        data: {
          datasets: data.datasets?.map((dataset, index) => ({
            ...dataset,
            backgroundColor: [
              'rgba(59, 130, 246, 0.6)',
              'rgba(16, 185, 129, 0.6)',
              'rgba(245, 158, 11, 0.6)'
            ][index % 3],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)'
            ][index % 3]
          })) || []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Strategic Options Analysis',
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
            x: {
              title: {
                display: true,
                text: 'Feasibility'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Impact'
              }
            }
          }
        }
      });
    } else {
      // Render grouped bar chart
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels || ['Option 1', 'Option 2', 'Option 3'],
          datasets: data.datasets?.map((dataset, index) => ({
            ...dataset,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)'
            ][index % 3],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)'
            ][index % 3],
            borderWidth: 2
          })) || []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Strategic Options Analysis',
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
              title: {
                display: true,
                text: 'Score'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Strategic Options'
              }
            }
          }
        }
      });
    }

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
