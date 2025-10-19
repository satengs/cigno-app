'use client';

import { useState } from 'react';
import Modal from './modals/Modal';
import Button from './buttons/Button';
import Textarea from './forms/Textarea';
import { Sparkles, ArrowRight } from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';

export default function ProjectDescriptionModal({ 
  isOpen, 
  onClose, 
  onProjectCreated,
  clientId 
}) {
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [prefilledData, setPrefilledData] = useState(null);

  const handleGenerateProject = async () => {
    if (!description.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate pre-filled data based on description
      const aiGeneratedData = {
        name: extractProjectName(description),
        description: description,
        status: 'Planning',
        start_date: generateStartDate(),
        end_date: generateEndDate(),
        client_owner: 'Jane Smith',
        internal_owner: 'Philippe Reynier',
        budget_amount: estimateBudget(description),
        budget_currency: 'USD',
        budget_type: 'Fixed',
        deliverables: generateDeliverables(description)
      };
      
      setPrefilledData(aiGeneratedData);
      setShowDetailedForm(true);
      
    } catch (error) {
      console.error('Error generating project:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // AI helper functions
  const extractProjectName = (desc) => {
    // Simple AI simulation - in real implementation, this would be actual AI
    if (desc.toLowerCase().includes('website')) return 'Website Development Project';
    if (desc.toLowerCase().includes('marketing')) return 'Marketing Campaign Project';
    if (desc.toLowerCase().includes('strategy')) return 'Strategic Consulting Project';
    if (desc.toLowerCase().includes('cbdc') || desc.toLowerCase().includes('digital currency')) {
      return 'CBDC Implementation Strategy';
    }
    return 'New Client Project';
  };

  const generateStartDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const generateEndDate = () => {
    const today = new Date();
    const endDate = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days from now
    return endDate.toISOString().split('T')[0];
  };

  const estimateBudget = (desc) => {
    const words = desc.split(' ').length;
    if (words > 50) return 75000;
    if (words > 25) return 50000;
    return 25000;
  };

  const generateDeliverables = (desc) => {
    const deliverables = [];
    
    if (desc.toLowerCase().includes('strategy') || desc.toLowerCase().includes('cbdc')) {
      deliverables.push({ name: 'Strategy Presentation', type: 'Presentation' });
      deliverables.push({ name: 'Implementation Roadmap', type: 'Strategy' });
    }
    
    if (desc.toLowerCase().includes('website') || desc.toLowerCase().includes('development')) {
      deliverables.push({ name: 'Technical Specification', type: 'Report' });
      deliverables.push({ name: 'User Interface Design', type: 'Design' });
    }
    
    if (desc.toLowerCase().includes('marketing')) {
      deliverables.push({ name: 'Marketing Strategy', type: 'Strategy' });
      deliverables.push({ name: 'Campaign Materials', type: 'Design' });
    }
    
    // Default deliverables if none matched
    if (deliverables.length === 0) {
      deliverables.push({ name: 'Project Report', type: 'Report' });
      deliverables.push({ name: 'Final Presentation', type: 'Presentation' });
    }
    
    return deliverables;
  };

  const handleBack = () => {
    setShowDetailedForm(false);
    setPrefilledData(null);
  };

  const handleDetailedFormClose = () => {
    setShowDetailedForm(false);
    setPrefilledData(null);
    setDescription('');
    onClose();
  };

  // Show the detailed form with pre-filled data
  if (showDetailedForm && prefilledData) {
    return (
      <CreateProjectModal
        isOpen={isOpen}
        onClose={handleDetailedFormClose}
        onProjectCreated={onProjectCreated}
        clientId={clientId}
        editItem={prefilledData}
        onBack={handleBack}
        isAIGenerated={true}
      />
    );
  }

  // Show the description input form
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Describe Your Project"
      subtitle="Tell us about your project and we'll help structure the details"
      size="md"
    >
      <div className="space-y-6">
        {/* Description Input */}
        <div>
          <Textarea
            label="Project Description"
            placeholder="Describe your project goals, deliverables, timeline, and any specific requirements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full"
          />
          <div className="mt-2 text-xs text-gray-500">
            💡 Be as detailed as possible. Include information about goals, deliverables, timeline, budget, and stakeholders.
          </div>
        </div>

        {/* Example Suggestions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Example descriptions:</h4>
          <div className="space-y-2 text-xs text-blue-700">
            <p>"We need to develop a comprehensive CBDC implementation strategy for our banking client, including technical infrastructure requirements and regulatory compliance."</p>
            <p>"Create a digital marketing campaign for Q1 2024 launch, including social media strategy, content creation, and performance analytics."</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerateProject}
            disabled={isProcessing || !description.trim()}
            className="flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Project</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}