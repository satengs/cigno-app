'use client';

import React, { useState } from 'react';
import { 
  Sparkles,
  Wand2,
  Layout,
  Smartphone,
  Monitor,
  Tablet,
  Upload,
  RefreshCw,
  Download,
  Eye,
  Code,
  Figma,
  Palette,
  Grid,
  Settings
} from 'lucide-react';

export default function DesignGenerator({ isOpen, onClose, onGenerate }) {
  const [designForm, setDesignForm] = useState({
    prompt: '',
    designType: 'wireframe',
    device: 'desktop',
    style: 'modern',
    complexity: 'intermediate',
    referenceImage: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!designForm.prompt.trim()) {
      alert('Please enter a design prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/design/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(designForm)
      });

      if (response.ok) {
        const data = await response.json();
        onGenerate(data.data);
        onClose();
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to generate design:', errorData);
        alert('Failed to generate design. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error generating design:', error);
      alert('Error generating design. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDesignForm(prev => ({ ...prev, referenceImage: e.target.result }));
      };
      reader.readAsDataURL(imageFile);
    }
  };

  const deviceOptions = [
    { value: 'mobile', label: 'Mobile', icon: Smartphone },
    { value: 'tablet', label: 'Tablet', icon: Tablet },
    { value: 'desktop', label: 'Desktop', icon: Monitor }
  ];

  const designTypes = [
    { value: 'wireframe', label: 'Wireframe', description: 'Low-fidelity structure and layout' },
    { value: 'mockup', label: 'Mockup', description: 'High-fidelity visual design' },
    { value: 'prototype', label: 'Prototype', description: 'Interactive design with flows' }
  ];

  const styleOptions = [
    { value: 'modern', label: 'Modern', preview: '#0066CC' },
    { value: 'minimal', label: 'Minimal', preview: '#000000' },
    { value: 'vibrant', label: 'Vibrant', preview: '#FF3366' },
    { value: 'professional', label: 'Professional', preview: '#2C3E50' },
    { value: 'playful', label: 'Playful', preview: '#FF6B6B' }
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center" 
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div 
        className="rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto" 
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full" style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.1 }}>
              <Wand2 className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                AI Design Generator
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Generate wireframes, mockups, and prototypes with AI
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 rounded-full" style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)' 
            }}>
              Step {currentStep}/3
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Design Prompt */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
                backgroundColor: currentStep >= 1 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: currentStep >= 1 ? 'white' : 'var(--text-secondary)'
              }}>1</div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                What do you want to design?
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Design Prompt <span style={{ color: 'var(--text-error)' }}>*</span>
              </label>
              <textarea
                value={designForm.prompt}
                onChange={(e) => setDesignForm(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="e.g., Create a dashboard for a banking app with transaction history, account balance, and quick transfer options"
                rows={3}
                className="w-full p-4 border rounded-lg text-sm resize-none"
                style={{ 
                  borderColor: 'var(--border-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
                onFocus={() => setCurrentStep(1)}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Describe your design idea in detail. Include the purpose, key features, and target audience.
              </p>
            </div>

            {/* Reference Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Reference Image (Optional)
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
                style={{ 
                  borderColor: dragOver ? 'var(--accent-primary)' : 'var(--border-secondary)',
                  backgroundColor: dragOver ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                }}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                {designForm.referenceImage ? (
                  <div className="space-y-2">
                    <img 
                      src={designForm.referenceImage} 
                      alt="Reference" 
                      className="max-h-32 mx-auto rounded"
                    />
                    <button 
                      type="button"
                      onClick={() => setDesignForm(prev => ({ ...prev, referenceImage: null }))}
                      className="text-xs px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto" style={{ color: 'var(--text-secondary)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Drop an image here or click to upload
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Upload inspiration images to influence the design style
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Design Type & Device */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
                backgroundColor: currentStep >= 2 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: currentStep >= 2 ? 'white' : 'var(--text-secondary)'
              }}>2</div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Choose Design Type & Device
              </h3>
            </div>

            {/* Design Type */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Design Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {designTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setDesignForm(prev => ({ ...prev, designType: type.value }));
                      setCurrentStep(Math.max(currentStep, 2));
                    }}
                    className="p-4 border rounded-lg text-left transition-all"
                    style={{
                      borderColor: designForm.designType === type.value ? 'var(--accent-primary)' : 'var(--border-primary)',
                      backgroundColor: designForm.designType === type.value ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      borderWidth: designForm.designType === type.value ? '2px' : '1px'
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Layout className="h-4 w-4" style={{ color: 'var(--text-primary)' }} />
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {type.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Device Selection */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Target Device
              </label>
              <div className="flex space-x-3">
                {deviceOptions.map((device) => {
                  const IconComponent = device.icon;
                  return (
                    <button
                      key={device.value}
                      type="button"
                      onClick={() => setDesignForm(prev => ({ ...prev, device: device.value }))}
                      className="flex-1 p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all"
                      style={{
                        borderColor: designForm.device === device.value ? 'var(--accent-primary)' : 'var(--border-primary)',
                        backgroundColor: designForm.device === device.value ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                        borderWidth: designForm.device === device.value ? '2px' : '1px'
                      }}
                    >
                      <IconComponent className="h-6 w-6" style={{ 
                        color: designForm.device === device.value ? 'var(--accent-primary)' : 'var(--text-secondary)' 
                      }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {device.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3: Style & Complexity */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
                backgroundColor: currentStep >= 3 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: currentStep >= 3 ? 'white' : 'var(--text-secondary)'
              }}>3</div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Style & Complexity
              </h3>
            </div>

            {/* Style Selection */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Design Style
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {styleOptions.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => {
                      setDesignForm(prev => ({ ...prev, style: style.value }));
                      setCurrentStep(3);
                    }}
                    className="p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all"
                    style={{
                      borderColor: designForm.style === style.value ? 'var(--accent-primary)' : 'var(--border-primary)',
                      backgroundColor: designForm.style === style.value ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      borderWidth: designForm.style === style.value ? '2px' : '1px'
                    }}
                  >
                    <div 
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: style.preview }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {style.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Complexity Level
              </label>
              <select
                value={designForm.complexity}
                onChange={(e) => setDesignForm(prev => ({ ...prev, complexity: e.target.value }))}
                className="w-full p-3 border rounded-lg text-sm"
                style={{ 
                  borderColor: 'var(--border-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="beginner">Beginner - Simple layouts with basic components</option>
                <option value="intermediate">Intermediate - Balanced design with common patterns</option>
                <option value="advanced">Advanced - Complex layouts with rich interactions</option>
                <option value="expert">Expert - Sophisticated design systems</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border transition-colors"
              style={{ 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isGenerating || !designForm.prompt.trim()}
              className="px-8 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium"
              style={{ 
                backgroundColor: isGenerating || !designForm.prompt.trim() ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                color: 'white',
                opacity: isGenerating || !designForm.prompt.trim() ? 0.6 : 1,
                cursor: isGenerating || !designForm.prompt.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating Design...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Design</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Keyboard Shortcuts Help */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>💡 Tip: Be specific about your design needs for better results</span>
            <span>Press Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}