import { useRef, useCallback } from 'react';

/**
 * Custom hook for managing chart references
 * Provides functions to register, retrieve, and clear chart references
 */
export function useChartRefs() {
  const chartRefs = useRef({});

  /**
   * Register a chart reference
   * @param {string} id - Unique identifier for the chart
   * @param {Object} chart - Chart instance or data
   */
  const registerChartRef = useCallback((id, chart) => {
    chartRefs.current[id] = chart;
  }, []);

  /**
   * Get a chart reference by ID
   * @param {string} id - Chart identifier
   * @returns {Object|undefined} Chart instance or undefined if not found
   */
  const getChartRef = useCallback((id) => {
    return chartRefs.current[id];
  }, []);

  /**
   * Clear all chart references
   */
  const clearChartRefs = useCallback(() => {
    chartRefs.current = {};
  }, []);

  /**
   * Get all chart references
   * @returns {Object} Object containing all chart references
   */
  const getAllChartRefs = useCallback(() => {
    return chartRefs.current;
  }, []);

  /**
   * Remove a specific chart reference
   * @param {string} id - Chart identifier to remove
   */
  const removeChartRef = useCallback((id) => {
    delete chartRefs.current[id];
  }, []);

  /**
   * Check if a chart reference exists
   * @param {string} id - Chart identifier
   * @returns {boolean} True if chart exists, false otherwise
   */
  const hasChartRef = useCallback((id) => {
    return id in chartRefs.current;
  }, []);

  /**
   * Get the count of registered charts
   * @returns {number} Number of registered charts
   */
  const getChartCount = useCallback(() => {
    return Object.keys(chartRefs.current).length;
  }, []);

  return {
    registerChartRef,
    getChartRef,
    clearChartRefs,
    getAllChartRefs,
    removeChartRef,
    hasChartRef,
    getChartCount
  };
}
