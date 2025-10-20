import React, { useState } from 'react';
import { parseSectionContent, validateSectionContent } from '../../lib/sectionContentParser.js';

export default function SectionContentParser() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState(null);

  const handleParse = () => {
    try {
      setError(null);
      const result = parseSectionContent(input);
      setParsed(result);
      
      const validationResult = validateSectionContent(result);
      setValidation(validationResult);
    } catch (err) {
      setError(err.message);
      setParsed(null);
      setValidation(null);
    }
  };

  const handleClear = () => {
    setInput('');
    setParsed(null);
    setValidation(null);
    setError(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Section Content Parser</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            JSON Input:
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm"
            placeholder='{"slide_content": {"title": "Test Title"}, "insights": ["Insight 1"], "citations": ["Source 1"]}'
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleParse}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Parse Content
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {parsed && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Parsed Content:</h2>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </div>

            {validation && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Validation Results:</h2>
                <div className={`p-4 rounded-md ${
                  validation.isValid 
                    ? 'bg-green-100 border border-green-400 text-green-700' 
                    : 'bg-yellow-100 border border-yellow-400 text-yellow-700'
                }`}>
                  <div className="font-semibold">
                    Valid: {validation.isValid ? 'Yes' : 'No'}
                  </div>
                  {!validation.isValid && validation.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="font-semibold">Errors:</div>
                      <ul className="list-disc list-inside mt-1">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
