'use client';

import { useState } from 'react';
import Modal from './modals/Modal';
import Button from './buttons/Button';
import UploadDocumentModal from './UploadDocumentModal';
import { 
  Type, 
  Upload, 
  Search, 
  ChevronRight 
} from 'lucide-react';

export default function CreateNewProjectModal({ 
  isOpen, 
  onClose, 
  onOptionSelect,
  loading = false
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showDescriptionForm, setShowDescriptionForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [description, setDescription] = useState('');

  const projectOptions = [
    {
      id: 'type-description',
      title: 'Type in a project description',
      description: 'Start with a brief description and we\'ll help you structure the project details',
      icon: Type,
      color: 'blue',
      disabled: false
    },
    {
      id: 'upload-document',
      title: 'Upload a document',
      description: 'Upload a client brief, RFP, or project outline to extract key information automatically',
      icon: Upload,
      color: 'green',
      disabled: false
    },
    {
      id: 'browse-knowledge',
      title: 'Browse your knowledge',
      description: 'Select from existing documents and resources in your knowledge base to create the project',
      icon: Search,
      color: 'purple',
      disabled: true
    }
  ];

  const handleOptionClick = (option) => {
    if (option.disabled) return;
    setSelectedOption(option.id);
    // Show description form immediately for "type-description"
    if (option.id === 'type-description') {
      setShowDescriptionForm(true);
    }
    // Show upload modal immediately for "upload-document"
    if (option.id === 'upload-document') {
      setShowUploadModal(true);
    }
  };

  const handleContinue = () => {
    if (selectedOption === 'type-description') {
      setShowDescriptionForm(true);
    } else if (selectedOption === 'upload-document') {
      setShowUploadModal(true);
    } else if (selectedOption) {
      onOptionSelect(selectedOption);
    }
  };

  const handleCreateProject = () => {
    if (description.trim()) {
      onOptionSelect('type-description', description.trim());
    }
  };

  const handleBack = () => {
    setShowDescriptionForm(false);
    setShowUploadModal(false);
    setSelectedOption(null);
    setDescription('');
  };

  const handleDocumentProcessed = (processedData) => {
    console.log('Document processed:', processedData);
    setShowUploadModal(false);
    
    // Transform the processed data into project format
    const projectData = {
      name: processedData.projectData.projectName || 'Document-Based Project',
      description: processedData.projectData.description || 'Project created from uploaded documents',
      objectives: processedData.projectData.objectives || [],
      deliverables: processedData.projectData.deliverables || [],
      requirements: processedData.projectData.requirements || [],
      scope: processedData.projectData.scope || '',
      budget_amount: processedData.projectData.budget?.amount || 0,
      budget_currency: processedData.projectData.budget?.currency || 'USD',
      budget_type: processedData.projectData.budget?.type || 'Fixed',
      start_date: processedData.projectData.timeline?.startDate || '',
      end_date: processedData.projectData.timeline?.endDate || '',
      client_name: processedData.projectData.clientInfo?.name || '',
      client_industry: processedData.projectData.clientInfo?.industry || '',
      status: 'Planning',
      extractionMethod: processedData.projectData.extractionMethod,
      sourceFiles: processedData.files.map(f => f.name),
      analyzedAt: processedData.processedAt,
      isDocumentBased: true
    };
    
    // Pass the processed data to the parent
    onOptionSelect('upload-document', projectData);
  };

  const getOptionStyles = (option) => {
    const isSelected = selectedOption === option.id;
    const isDisabled = option.disabled;
    const baseStyles = "w-full p-4 rounded-lg border-2 transition-all duration-200";
    
    if (isDisabled) {
      return `${baseStyles} border-gray-200 bg-gray-50 cursor-not-allowed opacity-60`;
    }
    
    if (isSelected) {
      return `${baseStyles} border-blue-500 bg-blue-50 shadow-md cursor-pointer hover:shadow-md`;
    }
    
    return `${baseStyles} border-gray-200 bg-white hover:border-gray-300 cursor-pointer hover:shadow-md`;
  };

  const getIconStyles = (option) => {
    const isSelected = selectedOption === option.id;
    const isDisabled = option.disabled;
    
    if (isDisabled) {
      return 'text-gray-400';
    }
    
    const colorMap = {
      blue: isSelected ? 'text-blue-600' : 'text-blue-500',
      green: isSelected ? 'text-green-600' : 'text-green-500',
      purple: isSelected ? 'text-purple-600' : 'text-purple-500'
    };
    
    return colorMap[option.color] || 'text-gray-500';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      subtitle={showDescriptionForm ? "Describe your project to get started" : "Choose how you'd like to create your project."}
      size="md"
    >
      {!showDescriptionForm ? (
        /* Step 1: Project Creation Options */
        <div className="space-y-4">
          <div className="space-y-3">
            {projectOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.id}
                  className={getOptionStyles(option)}
                  onClick={() => handleOptionClick(option)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 ${getIconStyles(option)}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                    
                    {/* Selection Indicator */}
                    {selectedOption === option.id && (
                      <div className="flex-shrink-0">
                        <ChevronRight className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!selectedOption}
              className="flex items-center space-x-2"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Step 2: Description Form */
        <div className="space-y-6">
          {/* Project Description Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project goals, deliverables, and key requirements..."
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
            />
          </div>

          {/* Create Project Button */}
          <div className="space-y-4">
            <Button
              type="button"
              onClick={handleCreateProject}
              disabled={!description.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing project...</span>
                </div>
              ) : (
                'Create Project'
              )}
            </Button>

            {/* Or choose another method */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Or choose another method</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center justify-center w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload a document
                </button>
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center w-full px-4 py-2 text-sm text-gray-400 bg-gray-50 rounded-lg cursor-not-allowed opacity-60"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Browse your knowledge
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              className="flex items-center space-x-2"
            >
              <span>← Back</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onDocumentProcessed={handleDocumentProcessed}
        loading={loading}
      />
    </Modal>
  );
}
