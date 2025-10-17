'use client';

import { useChartRefs } from '../../hooks/useChartRefs';
import { useEffect } from 'react';

/**
 * Example component demonstrating how to use chart references
 */
export default function ChartReferenceExample() {
  const {
    registerChartRef,
    getChartRef,
    getAllChartRefs,
    hasChartRef,
    getChartCount,
    clearChartRefs
  } = useChartRefs();

  // Example: Register a chart reference
  const registerExampleChart = () => {
    const chartData = {
      id: 'example-chart-1',
      title: 'Example Chart',
      config: {
        type: 'bar',
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [{
            label: 'Example Data',
            data: [10, 20, 30]
          }]
        }
      }
    };
    
    registerChartRef('example-chart-1', chartData);
    console.log('Chart registered:', chartData);
  };

  // Example: Get a specific chart reference
  const getExampleChart = () => {
    const chart = getChartRef('example-chart-1');
    console.log('Retrieved chart:', chart);
    return chart;
  };

  // Example: Get all chart references
  const getAllCharts = () => {
    const allCharts = getAllChartRefs();
    console.log('All charts:', allCharts);
    return allCharts;
  };

  // Example: Check if a chart exists
  const checkChartExists = () => {
    const exists = hasChartRef('example-chart-1');
    console.log('Chart exists:', exists);
    return exists;
  };

  // Example: Get chart count
  const getCount = () => {
    const count = getChartCount();
    console.log('Chart count:', count);
    return count;
  };

  // Example: Clear all chart references
  const clearAllCharts = () => {
    clearChartRefs();
    console.log('All charts cleared');
  };

  // Example: Log chart count on mount
  useEffect(() => {
    console.log('Initial chart count:', getChartCount());
  }, [getChartCount]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Chart Reference Management Example</h2>
      
      <div className="space-x-2">
        <button
          onClick={registerExampleChart}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Register Example Chart
        </button>
        
        <button
          onClick={getExampleChart}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Get Chart
        </button>
        
        <button
          onClick={getAllCharts}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Get All Charts
        </button>
        
        <button
          onClick={checkChartExists}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Check Chart Exists
        </button>
        
        <button
          onClick={getCount}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Get Count
        </button>
        
        <button
          onClick={clearAllCharts}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All Charts
        </button>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">Chart Count: {getChartCount()}</h3>
        <p className="text-sm text-gray-600">
          Open browser console to see the logged chart data and operations.
        </p>
      </div>
    </div>
  );
}
