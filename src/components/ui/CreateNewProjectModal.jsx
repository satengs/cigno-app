'use client';

import { useState } from 'react';
import Modal from './modals/Modal';
import Button from './buttons/Button';
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
  const [description, setDescription] = useState('');

  const projectOptions = [
    {
      id: 'type-description',
      title: 'Type in a project description',
      description: 'Start with a brief description and we\'ll help you structure the project details',
      icon: Type,
      color: 'blue'
    },
    {
      id: 'upload-document',
      title: 'Upload a document',
      description: 'Upload a client brief, RFP, or project outline to extract key information automatically',
      icon: Upload,
      color: 'green'
    },
    {
      id: 'browse-knowledge',
      title: 'Browse your knowledge',
      description: 'Select from existing documents and resources in your knowledge base to create the project',
      icon: Search,
      color: 'purple'
    }
  ];

  const handleOptionClick = (option) => {
    setSelectedOption(option.id);
    // Show description form immediately for "type-description"
    if (option.id === 'type-description') {
      setShowDescriptionForm(true);
    }
  };

  const handleContinue = () => {
    if (selectedOption === 'type-description') {
      setShowDescriptionForm(true);
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
    setSelectedOption(null);
    setDescription('');
  };

  const getOptionStyles = (option) => {
    const isSelected = selectedOption === option.id;
    const baseStyles = "w-full p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md";
    
    if (isSelected) {
      return `${baseStyles} border-blue-500 bg-blue-50 shadow-md`;
    }
    
    return `${baseStyles} border-gray-200 bg-white hover:border-gray-300`;
  };

  const getIconStyles = (option) => {
    const isSelected = selectedOption === option.id;
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
                  onClick={() => onOptionSelect('upload-document')}
                  className="flex items-center justify-center w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload a document
                </button>
                <button
                  type="button"
                  onClick={() => onOptionSelect('browse-knowledge')}
                  className="flex items-center justify-center w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
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
    </Modal>
  );
}
