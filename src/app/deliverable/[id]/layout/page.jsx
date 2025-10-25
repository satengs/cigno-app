'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import DeliverableLayoutView from '../../../../components/layout/deliverable/DeliverableLayoutView';

export default function DeliverableLayoutPage() {
  const { id } = useParams();
  const router = useRouter();
  const [deliverable, setDeliverable] = useState(null);
  const [storyline, setStoryline] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLayout, setSelectedLayout] = useState('default');
  const [availableLayouts, setAvailableLayouts] = useState([
    'default', 'title-2-columns', 'bcg-matrix', 'three-columns', 
    'full-width', 'timeline', 'process-flow'
  ]);

  // Load deliverable and storyline data
  useEffect(() => {
    if (id) {
      loadDeliverableData();
      loadStorylineData();
    }
  }, [id]);

  const loadDeliverableData = async () => {
    try {
      const response = await fetch(`/api/deliverables/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load deliverable');
      }
      const data = await response.json();
      setDeliverable(data.data || data);
    } catch (error) {
      console.error('Error loading deliverable:', error);
      router.push('/dashboard');
    }
  };

  const loadStorylineData = async () => {
    try {
      const response = await fetch(`/api/storylines?deliverable=${id}`);
      if (!response.ok) {
        throw new Error('Failed to load storyline');
      }
      const data = await response.json();
      const storylines = data.storylines || data;
      
      if (storylines.length > 0) {
        setStoryline(storylines[0]);
      }
    } catch (error) {
      console.error('Error loading storyline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLayoutChange = (layout) => {
    setSelectedLayout(layout);
  };

  const handleApplyLayoutToAll = () => {
    // Implement apply layout to all sections logic
    console.log('Apply layout to all sections');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading layout...</p>
        </div>
      </div>
    );
  }

  if (!storyline) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No storyline found</p>
          <p className="text-sm text-gray-500 mb-6">Generate a storyline first to access layout options.</p>
          <button
            onClick={() => router.push(`/deliverable/${id}/storyline`)}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            Go to Storyline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Navigation */}
      <div className="w-64 bg-gray-50 border-r">
        <div className="p-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="px-4">
          <h2 className="text-lg font-semibold text-gray-900">{deliverable?.name}</h2>
          <p className="text-sm text-gray-600">Layout</p>
        </div>
        <nav className="mt-4">
          <a
            href={`/deliverable/${id}`}
            className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Details
          </a>
          <a
            href={`/deliverable/${id}/storyline`}
            className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Storyline
          </a>
          <a
            href={`/deliverable/${id}/layout`}
            className="block px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100"
          >
            Layout
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <DeliverableLayoutView
          storyline={storyline}
          selectedLayout={selectedLayout}
          onLayoutChange={handleLayoutChange}
          onApplyLayoutToAll={handleApplyLayoutToAll}
          availableLayouts={availableLayouts}
        />
      </div>
    </div>
  );
}