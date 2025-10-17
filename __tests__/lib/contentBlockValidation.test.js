import { mapContentTypeToBlock } from '../../src/lib/storyline/sectionUtils';

describe('Content Block Type Validation', () => {
  describe('mapContentTypeToBlock', () => {
    test('should map valid content types to correct enum values', () => {
      const validMappings = [
        { input: 'chart', expected: 'Data Visualization' },
        { input: 'graph', expected: 'Data Visualization' },
        { input: 'visual', expected: 'Data Visualization' },
        { input: 'diagram', expected: 'Process Flow' },
        { input: 'flow', expected: 'Process Flow' },
        { input: 'timeline', expected: 'Timeline Layout' },
        { input: 'framework', expected: 'MECE Framework' },
        { input: 'mece', expected: 'MECE Framework' },
        { input: 'matrix', expected: 'BCG Matrix' },
        { input: 'bcg', expected: 'BCG Matrix' },
        { input: 'analysis', expected: 'Key Insights' },
        { input: 'insight', expected: 'Key Insights' },
        { input: 'checklist', expected: 'Process Flow' },
        { input: 'steps', expected: 'Process Flow' },
        { input: 'table', expected: 'Content Block' }
      ];

      validMappings.forEach(({ input, expected }) => {
        expect(mapContentTypeToBlock(input)).toBe(expected);
      });
    });

    test('should default to Content Block for unknown types', () => {
      const unknownTypes = [
        'Custom Type',
        'Random Type',
        'Unknown Type',
        'Some Other Type'
      ];

      unknownTypes.forEach(type => {
        expect(mapContentTypeToBlock(type)).toBe('Content Block');
      });
    });

    test('should map partial matches correctly', () => {
      const partialMatches = [
        { input: 'Market Analysis', expected: 'Key Insights' }, // contains "analysis"
        { input: 'Strategic Framework', expected: 'MECE Framework' }, // contains "framework"
        { input: 'Data Chart', expected: 'Data Visualization' }, // contains "chart"
        { input: 'Process Diagram', expected: 'Process Flow' } // contains "diagram"
      ];

      partialMatches.forEach(({ input, expected }) => {
        expect(mapContentTypeToBlock(input)).toBe(expected);
      });
    });

    test('should handle null and undefined inputs', () => {
      expect(mapContentTypeToBlock(null)).toBe('Content Block');
      expect(mapContentTypeToBlock(undefined)).toBe('Content Block');
      expect(mapContentTypeToBlock('')).toBe('Content Block');
    });

    test('should be case insensitive', () => {
      expect(mapContentTypeToBlock('CHART')).toBe('Data Visualization');
      expect(mapContentTypeToBlock('Framework')).toBe('MECE Framework');
      expect(mapContentTypeToBlock('ANALYSIS')).toBe('Key Insights');
    });
  });

  describe('Valid Content Block Types', () => {
    test('should only use valid enum values from schema', () => {
      const validEnumValues = [
        'BCG Matrix',
        'MECE Framework', 
        'Timeline Layout',
        'Process Flow',
        'Market Map',
        'Key Insights',
        'Case Study',
        'Data Visualization',
        'Content Block'
      ];

      // Test that our mapping function only returns valid enum values
      const testInputs = [
        'chart', 'graph', 'visual', 'diagram', 'flow', 'timeline',
        'framework', 'mece', 'matrix', 'bcg', 'analysis', 'insight',
        'checklist', 'steps', 'table', 'unknown', 'invalid'
      ];

      testInputs.forEach(input => {
        const result = mapContentTypeToBlock(input);
        expect(validEnumValues).toContain(result);
      });
    });
  });
});
