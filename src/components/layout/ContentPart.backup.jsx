'use client';
// Fixed parsing errors: renamed storylineSections to currentStorylineSections and fixed array syntax

import React, { useState, useEffect } from 'react';
import SectionNavigator from '../storyline/SectionNavigator';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Edit3,
  Copy,
  Lock,
  Eye,
  MoreHorizontal,
  Settings,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Sparkles,
  Wand2,
  Layout,
  PlusCircle,
  RefreshCw,
  Save,
  Download
} from 'lucide-react';
import StaffingInfo from '../ui/StaffingInfo';
import DeliverableMetrics from '../ui/DeliverableMetrics';
import DesignGenerator from '../ui/DesignGenerator';
import StorylineGenerationForm from '../ui/StorylineGenerationForm';
import ClientDetailView from '../ui/ClientDetailView';
import ProjectAwareChat from '../ui/ProjectAwareChat';
import DeliverableSettingsPage from '../deliverables/DeliverableSettingsPage';

export default function ContentPart({ selectedItem, onItemSelect, onItemDeleted }) {
  const [viewMode, setViewMode] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    settings: false,
    brief: false,
    design: true
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(28);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDesignGenerator, setShowDesignGenerator] = useState(false);
  const [showStorylineGenerator, setShowStorylineGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [generatedStoryline, setGeneratedStoryline] = useState(null);
  const [designForm, setDesignForm] = useState({
    prompt: '',
    designType: 'wireframe',
    device: 'desktop',
    style: 'modern',
    complexity: 'intermediate',
    referenceImage: null
  });
  const [showChat, setShowChat] = useState(false);
  const [showDeliverableSettings, setShowDeliverableSettings] = useState(false);
  const [deliverableForSettings, setDeliverableForSettings] = useState(null);
  
  // Deliverable form state
  const [documentLength, setDocumentLength] = useState(25);
  const [selectedFormat, setSelectedFormat] = useState('PPT');
  const [audiences, setAudiences] = useState(['Board of Directors', 'Technical Teams', 'Sarah Mitchell (CEO)']);
  const [deliverableName, setDeliverableName] = useState(selectedItem?.title || 'CBDC Implementation Strategy for Global Banking');
  const [deliverableType, setDeliverableType] = useState('Strategy Presentation');
  const [dueDate, setDueDate] = useState('15.02.2025');
  const [briefText, setBriefText] = useState(selectedItem?.description || 'Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities. The presentation should address technical infrastructure requirements, regulatory compliance considerations, and strategic positioning for competitive advantage in the evolving digital currency landscape.');
  
  // Tab switching state
  const [activeTab, setActiveTab] = useState('storyline'); // 'storyline', 'layout'

  // Helper functions
  const removeAudience = (index) => {
    setAudiences(audiences.filter((_, i) => i !== index));
  };

  const handleGenerateStoryline = async () => {
    setIsGenerating(true);
    
    try {
      const deliverableData = {
        name: deliverableName,
        type: deliverableType,
        audience: audiences,
        brief: briefText,
        format: selectedFormat,
        documentLength: documentLength,
        dueDate: dueDate
      };

      const deliverableId = selectedItem?.metadata?.deliverableId || selectedItem?._id || selectedItem?.id;
      console.log('🔍 Debug selectedItem:', selectedItem);
      console.log('🔍 Debug deliverableId:', deliverableId);
      console.log('🔍 Debug selectedItem.metadata:', selectedItem?.metadata);
      console.log('🔍 Debug selectedItem._id:', selectedItem?._id);
      console.log('🔍 Debug selectedItem.id:', selectedItem?.id);

      const response = await fetch('/api/storyline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          deliverableData,
          deliverableId,
          userId: null // Will be replaced with actual user authentication later
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGeneratedStoryline(result.storyline);
        console.log('✅ Storyline generated successfully:', result.storyline);
        
        if (result.storylineId) {
          console.log('🗃️ Storyline saved to database with ID:', result.storylineId);
        }
        
        if (result.metadata?.savedToDatabase) {
          console.log('✅ Database persistence confirmed');
        } else {
          console.log('⚠️ Storyline generated but not saved to database');
        }
      } else {
        console.error('❌ Failed to generate storyline:', result.error);
      }
    } catch (error) {
      console.error('Error calling storyline API:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImproveBrief = async () => {
    setIsGenerating(true);
    
    try {
      const briefData = {
        currentBrief: briefText,
        deliverableName: deliverableName,
        deliverableType: deliverableType,
        audience: audiences,
        format: selectedFormat,
        documentLength: documentLength,
        dueDate: dueDate
      };

      const response = await fetch('/api/improve-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ briefData }),
      });

      const result = await response.json();
      
      if (result.success) {
        setBriefText(result.improvedBrief);
        console.log('Brief improved successfully:', {
          qualityScore: result.qualityScore,
          improvements: result.improvements
        });
      } else {
        console.error('Failed to improve brief:', result.error);
      }
    } catch (error) {
      console.error('Error calling improve brief API:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            setShowDesignGenerator(true);
            break;
          case 'r':
            if (generatedDesign) {
              e.preventDefault();
              handleResetDesign();
            }
            break;
        }
      }
      if (e.key === 'Escape') {
        if (showDesignGenerator) {
          setShowDesignGenerator(false);
        }
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDesignGenerator, showDeleteConfirm, generatedDesign]);

  // Load existing storyline when selectedItem changes
  useEffect(() => {
    console.log('🎯 useEffect triggered with selectedItem:', selectedItem);
    console.log('🎯 selectedItem type:', typeof selectedItem);
    console.log('🎯 selectedItem?._id:', selectedItem?._id);
    console.log('🎯 selectedItem?.id:', selectedItem?.id);
    
    const loadExistingStoryline = async () => {
      if (!selectedItem?._id && !selectedItem?.id) {
        console.log('❌ Early return: no valid selectedItem ID');
        return;
      }
      
      const deliverableId = selectedItem._id || selectedItem.id;
      
      try {
        console.log('🔍 Loading existing storyline for deliverable:', deliverableId);
        
        // Load actual storyline from database
        const response = await fetch(`/api/storylines?deliverableId=${deliverableId}`);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.ok && result.data.storylines.length > 0) {
            const existingStoryline = result.data.storylines[0];
            console.log('✅ Found existing storyline:', existingStoryline._id);
            
            // Use the database storyline directly - it already has the right structure
            const convertedStoryline = {
              ...existingStoryline,
              sections: existingStoryline.sections
            };
            
            console.log('🔧 Setting storyline state with', convertedStoryline.sections?.length, 'sections');
            setGeneratedStoryline(convertedStoryline);
          } else {
            console.log('📝 No existing storyline found for this deliverable');
            setGeneratedStoryline(null);
          }
        } else {
          console.log('❌ Failed to fetch storylines from API');
          setGeneratedStoryline(null);
        }
      } catch (error) {
        console.error('❌ Error loading existing storyline:', error);
        setGeneratedStoryline(null);
      }
    };

    loadExistingStoryline();
  }, [selectedItem]);

  // Sample data for sources
  const internalSources = [
    {
      id: 1,
      title: "CBDC Market Analysis Report",
      description: "Internal research document on global CBDC trends",
      type: "pdf",
      pages: 45,
      completion: 85,
      source: "Internal Research"
    },
    {
      id: 2,
      title: "Digital Banking Strategy Framework",
      description: "Strategic framework for digital transformation",
      type: "document",
      pages: 12,
      completion: 92,
      source: "Strategy Team"
    },
    {
      id: 3,
      title: "Regulatory Compliance Guidelines",
      description: "Compliance requirements for financial institutions",
      type: "pdf",
      pages: 28,
      completion: 78,
      source: "Legal Team"
    },
    {
      id: 4,
      title: "Risk Assessment Template",
      description: "Standard risk evaluation methodology",
      type: "document",
      pages: 22,
      completion: 88,
      source: "Risk Management"
    }
  ];


  // TEMPORARY: Use test data to verify rendering works
  const testStoryline = {
    sections: [
      {
        id: 'test_section_1',
        title: 'Test Database Section 1',
        description: 'This is a test section from database',
        status: 'draft',
        locked: false,
        keyPoints: ['Test point 1', 'Test point 2'],
        estimatedSlides: 3
      },
      {
        id: 'test_section_2', 
        title: 'Test Database Section 2',
        description: 'Another test section',
        status: 'not_started',
        locked: true,
        keyPoints: ['Another test point'],
        estimatedSlides: 2
      }
    ]
  };

  // TEMPORARY FIX: Show database-format test sections for deliverables with storylines
  console.log('🎯 Rendering with selectedItem:', !!selectedItem, 'ID:', selectedItem?._id || selectedItem?.id);
  
  // For now, show test database sections that match the database format for any deliverable 
  const storylineSectionsOld = [
    {
      id: 'exec_summary',
      title: 'Executive Summary',
      description: 'CBDC implementation represents a critical strategic opportunity for competitive advantage. Comprehensive technical and regulatory framework required for successful deployment.',
      status: 'draft',
      order: 0,
      keyPoints: [
        'CBDC implementation represents a critical strategic opportunity for competitive advantage',
        'Comprehensive technical and regulatory framework required for successful deployment',
        'Phased implementation approach recommended with clear milestones and risk mitigation'
      ],
      estimatedSlides: 2,
      locked: false
    },
    {
      id: 'section_1',
      title: 'Market Context & Strategic Rationale',
      description: 'Global CBDC adoption trends and competitive landscape analysis. Strategic benefits and business case for implementation.',
      status: 'not_started',
      order: 1,
      keyPoints: [
        'Global CBDC adoption trends and competitive landscape analysis',
        'Strategic benefits and business case for implementation',
        'Risk assessment and mitigation strategies'
      ],
      estimatedSlides: 4,
      locked: false
    },
    {
      id: 'section_2',
      title: 'Technical Architecture & Infrastructure',
      description: 'Core technology stack and system architecture requirements. Integration with existing banking infrastructure.',
      status: 'not_started',
      order: 2,
      keyPoints: [
        'Core technology stack and system architecture requirements',
        'Integration with existing banking infrastructure',
        'Security, scalability, and performance considerations'
      ],
      estimatedSlides: 6,
      locked: true
    },
    {
      id: 'call_to_action',
      title: 'Recommended Next Steps',
      description: 'Immediate actions required for project initiation. Key stakeholder approvals and sign-offs needed.',
      status: 'not_started',
      order: 6,
      keyPoints: [
        'Immediate actions required for project initiation',
        'Key stakeholder approvals and sign-offs needed',
        'Timeline for decision-making and implementation start'
      ],
      estimatedSlides: 1,
      locked: false
    }
  ];

  // TODO: Replace with actual database loading once selectedItem issue is resolved
  
  // For now, use sample storyline sections that match database format
  const currentStorylineSections = [
    {
      id: 'exec_summary',
      title: 'Executive Summary',
      status: 'draft',
      description: 'High-level overview of the CBDC strategy and key recommendations for financial institutions.',
      locked: false,
      estimatedSlides: 3,
      keyPoints: ['Strategic opportunity for competitive advantage', 'Comprehensive framework required', 'Phased implementation recommended']
    },
    {
      id: 'section_1',
      title: 'Market Context & Strategic Rationale',
      status: 'not_started',
      description: 'Global CBDC adoption trends and competitive landscape analysis.',
      locked: false,
      estimatedSlides: 4,
      keyPoints: ['Global adoption trends', 'Business case for implementation', 'Risk assessment strategies']
    },
    {
      id: 'section_2',
      title: 'Technical Architecture & Infrastructure',
      status: 'not_started',
      description: 'Core technology stack and system architecture requirements.',
      locked: true,
      estimatedSlides: 6,
      keyPoints: ['Technology requirements', 'Banking infrastructure integration', 'Security considerations']
    },
    {
      id: 'call_to_action',
      title: 'Recommended Next Steps',
      status: 'not_started',
      description: 'Immediate actions required for project initiation.',
      locked: false,
      estimatedSlides: 1,
      keyPoints: ['Project initiation actions', 'Stakeholder approvals needed', 'Implementation timeline']
    }
  ];

  const designSectionsOld = generatedDesign?.design?.sections || [
    {
      id: 1,
      title: "Executive Summary",
      status: "Final",
      description: "High-level overview of CBDC strategy and recommendations.",
      blocks: [
        { type: "BCG Matrix", items: ["Stars", "Questions", "Cash Cows", "Dogs"] },
        { type: "Key Insights", items: [] }
      ]
    }
  ];

  const documentContentOld = {
    title: "Central Bank Digital Currencies: Implementation Strategy for Financial Institutions",
    sections: [
    {
      id: 4,
      title: "Technical Architecture & Integration",
      status: "Not Started",
      description: "Technical specifications for CBDC integration with existing banking infrastructure and security frameworks.",
      sources: [2, 4],
      estimatedSlides: 7
    },
    {
      id: 5,
      title: "Risk Assessment & Compliance",
      status: "Not Started",
      description: "Comprehensive assessment of regulatory compliance requirements and risk mitigation strategies for CBDC implementation.",
      sources: [3, 4],
      estimatedSlides: 6,
      locked: true
    },
    {
      id: 6,
      title: "Implementation Roadmap",
      status: "Not Started",
      description: "Phased approach to CBDC implementation with key milestones, resource allocation, and timeline considerations.",
      sources: [1, 2, 3],
      estimatedSlides: 9
    }
  ]
  };

  // Use generated design if available, otherwise fallback to sample data
  const designSections = generatedDesign?.design?.sections || [
    {
      id: 1,
      title: "Executive Summary",
      status: "Final",
      description: "This section provides a high-level overview of the CBDC strategy and key recommendations for financial institutions preparing for central bank digital currencies.",
      content: "Select a layout design for this section",
      link: "See full section content",
      blocks: [
        { type: "BCG Matrix", items: ["Stars", "Questions", "Cash Cows", "Dogs"] },
        { type: "MECE Bullets (3-column)", items: ["Column 1", "Column 2", "Column 3"] },
        { type: "Insight +", items: [] }
      ]
    },
    {
      id: 2,
      title: "Market Context & CBDC Landscape",
      status: "Draft",
      description: "Analysis of the current state of CBDC development globally and key market drivers influencing adoption trajectories.",
      content: "Select a layout design for this section",
      link: "See full section content",
      blocks: [
        { type: "Timeline Layout", items: [] },
        { type: "Process Flow", items: [] },
        { type: "Market Map", items: [] }
      ]
    },
    {
      id: 3,
      title: "Strategic Implications for Financial Institutions",
      status: "Draft",
      description: "Detailed exploration of how CBDCs will impact existing business models and create new opportunities for financial services.",
      content: "Select a layout design for this section",
      link: "See full section content",
      blocks: []
    },
    {
      id: 4,
      title: "Technical Architecture & Integration",
      status: "Not Started",
      description: "Technical specifications for CBDC integration with existing banking infrastructure and security frameworks.",
      content: "Select a layout design for this section",
      link: "See full section content",
      blocks: []
    },
    {
      id: 5,
      title: "Risk Assessment & Compliance",
      status: "Not Started",
      description: "Comprehensive assessment of regulatory compliance requirements and risk mitigation strategies for CBDC implementation.",
      content: "Select a layout design for this section",
      link: "See full section content",
      blocks: []
    },
    {
      id: 6,
      title: "Implementation Roadmap",
      status: "Not Started",
      description: "Phased approach to CBDC implementation with key milestones, resource allocation, and timeline considerations.",
      content: "Select a layout design for this section",
      link: "See full section content",
      blocks: []
    }
  ];

  const documentContent = {
    title: "Central Bank Digital Currencies: Implementation Strategy for Financial Institutions",
    author: "McKinsey & Company",
    currentPage: 14,
    totalPages: 28,
    content: {
      executiveSummary: {
        title: "Executive Summary",
        paragraphs: [
          "The rapid evolution of central bank digital currencies (CBDCs) represents a fundamental shift in the global financial landscape. As monetary authorities worldwide accelerate their digital currency initiatives, financial institutions must prepare for unprecedented changes in payment infrastructure, customer engagement, and operational models.",
          "Our analysis indicates that CBDCs will impact approximately 80% of central banks by 2025, with pilot programs already underway in over 50 countries. The implications for commercial banks, payment processors, and fintech companies are profound and immediate."
        ]
      },
      keyFinding: {
        title: "Key Finding: Preparation Timeline",
        description: "Financial institutions require a 12-18 month preparation window to adequately adapt their systems, processes, and customer interfaces for CBDC integration. This timeline encompasses technical infrastructure updates, regulatory compliance adjustments, staff training, and customer education initiatives.",
        phases: [
          "Phase 1 (Months 1-6): Infrastructure assessment and strategic planning",
          "Phase 2 (Months 7-12): System development and integration testing",
          "Phase 3 (Months 13-18): Pilot programs and staff training"
        ],
        conclusion: "The institutions that begin preparation now will be positioned to capitalize on the competitive advantages that CBDC integration offers, including reduced transaction costs, enhanced customer experiences, and new revenue opportunities through programmable money features."
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Final':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Draft':
        return <Edit3 className="h-4 w-4 text-yellow-500" />;
      case 'Not Started':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Final':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Draft':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Not Started':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Delete deliverable function
  const handleDeleteDeliverable = async () => {
    if (!selectedItem || selectedItem.type !== 'deliverable') {
      console.error('No deliverable selected for deletion');
      return;
    }

    try {
      // Get the deliverable ID from either the item itself or its metadata
      const deliverableId = selectedItem.metadata?.deliverableId || selectedItem._id || selectedItem.id;
      
      const response = await fetch(`/api/deliverables?id=${deliverableId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Call the parent callback to refresh the menu and clear selection
        if (onItemDeleted) {
          onItemDeleted(selectedItem);
        }
        // Clear the current selection
        if (onItemSelect) {
          onItemSelect(null);
        }
        console.log('Deliverable deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete deliverable:', errorData.error);
        alert('Failed to delete deliverable. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting deliverable:', error);
      alert('Error deleting deliverable. Please try again.');
    }
    
    setShowDeleteConfirm(false);
  };

  // Show delete confirmation
  const confirmDelete = () => {
    if (!selectedItem) {
      alert('No item selected');
      return;
    }
    
    if (selectedItem.type !== 'deliverable') {
      alert(`Delete is only available for deliverables. Selected item type: ${selectedItem.type}`);
      return;
    }
    
    setShowDeleteConfirm(true);
  };

  // Handle opening deliverable settings
  const handleOpenDeliverableSettings = async () => {
    if (!selectedItem || selectedItem.type !== 'deliverable') {
      console.log('Settings only available for deliverables');
      return;
    }

    try {
      // Get the deliverable ID from the selected item
      const deliverableId = selectedItem.metadata?.deliverableId || 
                           selectedItem.metadata?.business_entity_id || 
                           selectedItem._id || 
                           selectedItem.id;

      console.log('📋 Opening settings for deliverable:', deliverableId);

      // Fetch the full deliverable data
      const response = await fetch(`/api/deliverables/${deliverableId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch deliverable: ${response.status}`);
      }
      
      const deliverableData = await response.json();
      console.log('✅ Deliverable data fetched:', deliverableData);
      
      setDeliverableForSettings(deliverableData);
      setShowDeliverableSettings(true);
    } catch (error) {
      console.error('❌ Error fetching deliverable for settings:', error);
      alert('Failed to load deliverable settings. Please try again.');
    }
  };

  // Handle saving deliverable settings
  const handleSaveDeliverableSettings = (updatedDeliverable) => {
    console.log('💾 Deliverable settings saved:', updatedDeliverable);
    // Update the selected item if needed
    if (onItemSelect) {
      onItemSelect({
        ...selectedItem,
        ...updatedDeliverable
      });
    }
    setShowDeliverableSettings(false);
    setDeliverableForSettings(null);
  };

  // Handle closing deliverable settings
  const handleCloseDeliverableSettings = () => {
    setShowDeliverableSettings(false);
    setDeliverableForSettings(null);
  };

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Handle design generation from DesignGenerator component
  const handleDesignGenerate = (designData) => {
    setGeneratedDesign(designData);
    console.log('✅ Design generated successfully:', designData);
  };

  // Handle storyline generation
  const handleStorylineGenerate = async (formData) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-storyline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.name,
          industry: formData.industry,
          audience: formData.audience.join(', '),
          objectives: formData.brief,
          sectionsCount: 6,
          presentationStyle: 'consulting',
          complexity: formData.complexity
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedStoryline(data.data);
        console.log('✅ Storyline generated successfully:', data.data);
      } else {
        console.error('Failed to generate storyline');
        // Fallback to mock data
        setGeneratedStoryline({
          sections: currentStorylineSections,
          executiveSummary: 'AI-generated executive summary for the presentation.',
          presentationFlow: 'Structured narrative flow connecting all sections logically.',
          callToAction: 'Recommended next steps and implementation guidance.',
          totalSections: currentStorylineSections.length,
          estimatedDuration: currentStorylineSections.reduce((acc, s) => acc + s.estimatedSlides, 0) * 2
        });
      }
    } catch (error) {
      console.error('Error generating storyline:', error);
      // Fallback to mock data
      setGeneratedStoryline({
        sections: currentStorylineSections,
        executiveSummary: 'AI-generated executive summary for the presentation.',
        presentationFlow: 'Structured narrative flow connecting all sections logically.',
        callToAction: 'Recommended next steps and implementation guidance.',
        totalSections: currentStorylineSections.length,
        estimatedDuration: currentStorylineSections.reduce((acc, s) => acc + s.estimatedSlides, 0) * 2
      });
    } finally {
      setIsGenerating(false);
      setShowStorylineGenerator(false);
    }
  };


  // Reset to sample data
  const handleResetDesign = () => {
    setGeneratedDesign(null);
    setDesignForm({
      prompt: '',
      designType: 'wireframe',
      device: 'desktop',
      style: 'modern',
      complexity: 'intermediate',
      referenceImage: null
    });
  };

  // Determine content type based on selected item
  const getContentType = () => {
    if (!selectedItem) return 'empty';
    
    // Check if it's a deliverable (presentation/design)
    if (selectedItem.type === 'deliverable') {
      return 'deliverable-overview';
    }
    
    // Check if it's an external resource (document)
    if (selectedItem.type === 'external' || selectedItem.title?.includes('McKinsey')) {
      return 'document';
    }
    
    // Check if it's a project that should show storyline
    if (selectedItem.type === 'project' && selectedItem.title?.includes('CBDC')) {
      return 'storyline';
    }
    
    // Check if it's a project that should show project overview
    if (selectedItem.type === 'project') {
      return 'project-overview';
    }
    
    // Check if it's a client that should show overview
    if (selectedItem.type === 'client') {
      return 'client-overview';
    }
    
    return 'empty';
  };

  const contentType = getContentType();

  // Show deliverable settings page if requested
  if (showDeliverableSettings && deliverableForSettings) {
    return (
      <div className="flex-1 p-0 flex flex-col min-h-0">
        <DeliverableSettingsPage
          deliverable={deliverableForSettings}
          onSave={handleSaveDeliverableSettings}
          onBack={handleCloseDeliverableSettings}
        />
      </div>
    );
  }

  if (contentType === 'empty') {
    return (
      <div className="flex-1 p-2 flex flex-col min-h-0">
        {/* Theme Toggle at top */}
        <div className="flex justify-end mb-4">
          {/* Empty theme toggle space */}
        </div>
        
        <div 
          className="flex-1 rounded-lg border-2 border-dashed flex items-center justify-center"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Select an Item
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Choose a deliverable or resource from the left menu to view its content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (contentType === 'client-overview') {
    return (
      <div className="flex-1 p-6 flex flex-col min-h-0">
        <ClientDetailView 
          client={selectedItem}
          onUpdate={async (updatedClient) => {
            // TODO: Implement client update logic
            console.log('Updating client:', updatedClient);
          }}
          onDelete={async (clientToDelete) => {
            // TODO: Implement client deletion logic
            console.log('Deleting client:', clientToDelete);
            onItemDeleted?.(clientToDelete);
          }}
          onAddProject={(client) => {
            // Open the project creation modal
            setShowUnifiedAddModal(true);
            setAddItemType('project');
            console.log('Opening project creation for client:', client);
          }}
        />
      </div>
    );
  }

  if (contentType === 'project-overview') {
    return (
      <div className="flex-1 p-2 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Theme Toggle at top */}
          <div className="flex justify-end mb-4">
            {/* Empty theme toggle space */}
          </div>
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {selectedItem?.title || 'Project Overview'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Project details and deliverable management
            </p>
          </div>

          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Project Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Name:</span>
                    <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{selectedItem?.title || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Description:</span>
                    <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{selectedItem?.description || 'No description available'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Client:</span>
                    <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{selectedItem?.metadata?.client_owner || 'No client assigned'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Status:</span>
                    <span className="ml-2 px-2 py-1 rounded text-xs" style={{ 
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)'
                    }}>{selectedItem?.status || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Manager:</span>
                    <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{selectedItem?.metadata?.internal_owner || 'No manager assigned'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Budget:</span>
                    <span className="ml-2" style={{ color: 'var(--text-primary)' }}>
                      {selectedItem?.metadata?.budget_amount ? `$${Number(selectedItem.metadata.budget_amount).toLocaleString()}` : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Start Date:</span>
                    <span className="ml-2" style={{ color: 'var(--text-primary)' }}>
                      {selectedItem?.metadata?.start_date ? new Date(selectedItem.metadata.start_date).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>End Date:</span>
                    <span className="ml-2" style={{ color: 'var(--text-primary)' }}>
                      {selectedItem?.metadata?.end_date ? new Date(selectedItem.metadata.end_date).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Deliverables
                </h3>
                <div className="space-y-2">
                  {selectedItem?.children && selectedItem.children.length > 0 ? (
                    selectedItem.children.map((deliverable, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {deliverable.title}
                        </span>
                        <span className="px-2 py-1 rounded text-xs" style={{ 
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)'
                        }}>{deliverable.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                      No deliverables found for this project
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Project Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {selectedItem?.children?.length || 0}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Deliverables</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {selectedItem?.children?.filter(d => d.status === 'completed').length || 0}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {selectedItem?.children?.filter(d => d.status !== 'completed').length || 0}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {selectedItem?.children?.length > 0 
                        ? Math.round((selectedItem.children.filter(d => d.status === 'completed').length / selectedItem.children.length) * 100)
                        : 0
                      }%
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Progress</div>
                  </div>
                </div>
              </div>

              {/* Staffing Information */}
              <StaffingInfo 
                staffing={[
                  {
                    user: { first_name: 'Sarah', last_name: 'Johnson' },
                    role: 'project_manager',
                    allocation_percentage: 100,
                    start_date: '2024-01-01',
                    end_date: '2024-06-30',
                    hourly_rate: 150,
                    notes: 'Lead project manager with 10+ years experience'
                  },
                  {
                    user: { first_name: 'Michael', last_name: 'Chen' },
                    role: 'consultant',
                    allocation_percentage: 80,
                    start_date: '2024-01-15',
                    end_date: '2024-05-15',
                    hourly_rate: 120,
                    notes: 'CBDC specialist and technical consultant'
                  },
                  {
                    user: { first_name: 'Emma', last_name: 'Williams' },
                    role: 'analyst',
                    allocation_percentage: 60,
                    start_date: '2024-02-01',
                    end_date: '2024-04-30',
                    hourly_rate: 90,
                    notes: 'Financial analysis and market research'
                  }
                ]}
                isEditable={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (contentType === 'deliverable-overview') {
    return (
      <div className="flex-1 p-6 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {selectedItem?.title || 'CBDC Strategy Presentation'}
          </h1>
          <div className="flex space-x-2">
            <button
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)'
              }}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteDeliverable}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-danger)',
                border: '1px solid var(--border-primary)'
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'storyline', label: 'Storyline' },
            { id: 'layout', label: 'Layout' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--text-primary)',
                border: activeTab === tab.id ? 'none' : '1px solid var(--border-primary)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {/* Storyline Tab */}
        {activeTab === 'storyline' && (
          <div className="space-y-4">
            {generatedStoryline && generatedStoryline.sections ? (
              <SectionNavigator 
                sections={generatedStoryline.sections}
                currentSectionIndex={currentSectionIndex}
                onSectionChange={setCurrentSectionIndex}
              />
            ) : (
              // Show deliverable settings when no storyline exists
              <DeliverableSettingsPage
                deliverable={selectedItem}
                onSave={handleSaveDeliverableSettings}
                onBack={() => {}}
              />
            )}
          </div>
        )}

      </div>
    );
  }

  if (contentType === 'storyline') {
    return (
      <div className="flex-1 p-2 flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {selectedItem?.title || 'CBDC Strategy Presentation'}
              {generatedStoryline && (
                <span className="ml-2 px-2 py-1 rounded text-xs flex items-center space-x-1" style={{ 
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white'
                }}>
                  <Sparkles className="h-3 w-3" />
                  <span>AI Generated</span>
                </span>
              )}
            </h1>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowStorylineGenerator(true)}
                className="px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center space-x-1"
                style={{ 
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
                title="Generate Storyline"
              >
                <Wand2 className="h-4 w-4" />
                <span className="text-sm">Generate Storyline</span>
              </button>
              <button 
                className="p-1 rounded transition-colors cursor-pointer"
                style={{ 
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={handleOpenDeliverableSettings}
                title="Deliverable Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              {selectedItem && (
                <button 
                  className="p-1 rounded transition-colors cursor-pointer"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: selectedItem?.type === 'deliverable' ? 'var(--text-secondary)' : 'var(--text-secondary)',
                    opacity: selectedItem?.type === 'deliverable' ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmDelete();
                  }}
                  title={selectedItem?.type === 'deliverable' ? "Delete deliverable" : "Delete not available for this item type"}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* View Mode Selector */}
          <div 
            className="flex items-center rounded-lg p-1"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            {['Storyline', 'Layout'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode.toLowerCase())}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                style={{
                  backgroundColor: viewMode === mode.toLowerCase() ? 'var(--bg-primary)' : 'transparent',
                  color: viewMode === mode.toLowerCase() ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: viewMode === mode.toLowerCase() ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== mode.toLowerCase()) {
                    e.target.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== mode.toLowerCase()) {
                    e.target.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span>{mode}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content based on view mode */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'storyline' && (
            <div className="space-y-4">
              {currentStorylineSections.map((section, index) => (
                <div 
                  key={section.id} 
                  className="border rounded-lg p-4 transition-shadow"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-secondary)'
                  }}
                  onMouseEnter={(e) => e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'}
                  onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {section.id}/{currentStorylineSections.length}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                            {section.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(section.status)}`}>
                            {section.status}
                          </span>
                          {section.locked && (
                            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
                          {section.description}
                        </p>
                        {section.sources && section.sources.length > 0 && (
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Sources: {section.sources.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      <button 
                        className="p-1.5 rounded transition-colors"
                        style={{ 
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary)'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-1.5 rounded transition-colors"
                        style={{ 
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary)'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Removed detailed view mode as it duplicates storyline content */}

          {viewMode === 'layout' && (
            <div className="space-y-4">
              {currentStorylineSections.map((section, index) => (
                <div 
                  key={section.id} 
                  className="border rounded-lg p-4 transition-shadow"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-secondary)'
                  }}
                  onMouseEnter={(e) => e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'}
                  onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ 
                          backgroundColor: 'var(--accent-primary)', 
                          color: 'white' 
                        }}>
                          {section.id}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {section.title}
                          </h3>
                          {section.locked && (
                            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                          {section.description}
                        </p>
                        
                        {/* Layout options */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            Layout Options
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {['Timeline Layout', 'Process Flow', 'Market Map', 'Comparison Table', 'Infographic', 'Data Visualization'].map((layout, idx) => (
                              <div 
                                key={idx}
                                className="border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md"
                                style={{
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderColor: 'var(--border-primary)'
                                }}
                                onMouseEnter={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                                onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-primary)'}
                              >
                                <div className="flex items-center space-x-2">
                                  <Layout className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} />
                                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {layout}
                                  </span>
                                </div>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                  {layout === 'Timeline Layout' && 'Chronological progression of events'}
                                  {layout === 'Process Flow' && 'Step-by-step workflow visualization'}
                                  {layout === 'Market Map' && 'Market landscape and positioning'}
                                  {layout === 'Comparison Table' && 'Side-by-side feature comparison'}
                                  {layout === 'Infographic' && 'Visual data representation'}
                                  {layout === 'Data Visualization' && 'Charts and graphs for data'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button 
                        className="p-2 rounded transition-colors"
                        style={{ 
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary)'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        title="Preview layout"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-2 rounded transition-colors"
                        style={{ 
                          backgroundColor: 'transparent',
                          color: 'var(--text-secondary)'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        title="More options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (contentType === 'design') {
    return (
      <div className="flex-1 p-2 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Theme Toggle at top */}
          <div className="flex justify-end mb-4">
            {/* Empty theme toggle space */}
          </div>
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {selectedItem?.title || 'AI Design Generator'}
                {generatedDesign && (
                  <span className="ml-2 px-2 py-1 rounded text-xs flex items-center space-x-1" style={{ 
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white'
                  }}>
                    <Sparkles className="h-3 w-3" />
                    <span>AI Generated</span>
                  </span>
                )}
              </h1>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowDesignGenerator(true)}
                  className="px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center space-x-1"
                  style={{ 
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                  title="Generate AI Design (Ctrl+K)"
                >
                  <Wand2 className="h-4 w-4" />
                  <span className="text-sm">Generate AI Design</span>
                  <span className="text-xs opacity-70 ml-1">⌘K</span>
                </button>
                {generatedDesign && (
                  <button 
                    onClick={handleResetDesign}
                    className="p-1.5 rounded transition-colors cursor-pointer"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Reset design (Ctrl+R)"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                <button 
                  className="p-1 rounded transition-colors cursor-pointer"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <Settings className="h-5 w-5" />
                </button>
                {/* Show delete button when item is selected */}
                {selectedItem && (
                  <button 
                    className="p-1 rounded transition-colors cursor-pointer"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: selectedItem?.type === 'deliverable' ? 'var(--text-secondary)' : 'var(--text-secondary)',
                      opacity: selectedItem?.type === 'deliverable' ? 1 : 0.5
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      confirmDelete();
                    }}
                    title={selectedItem?.type === 'deliverable' ? "Delete deliverable" : "Delete not available for this item type"}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              {/* Design Generation Section Header */}
              <div className="flex items-center space-x-2">
                <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                  AI Design Generator
                </span>
              </div>
              
              {/* View Mode Selector */}
              <div 
                className="flex items-center rounded-lg p-1"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                {['overview', 'brief', 'standard', 'full', 'layout'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                    style={{
                      backgroundColor: viewMode === mode ? 'var(--bg-primary)' : 'transparent',
                      color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: viewMode === mode ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== mode) {
                        e.target.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== mode) {
                        e.target.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: viewMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                    />
                    <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Generated Design Summary */}
          {generatedDesign && (
            <div 
              className="mb-6 p-4 rounded-lg border" 
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--accent-primary)',
                borderWidth: '2px'
              }}
            >
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  AI Generated Design
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Design Prompt
                  </label>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{generatedDesign.prompt}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Design Type
                  </label>
                  <p className="text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{generatedDesign.designType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Target Device
                  </label>
                  <p className="text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{generatedDesign.device}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Design Style
                  </label>
                  <p className="text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{generatedDesign.style}</p>
                </div>
              </div>
              {generatedDesign.design?.layout && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Layout Structure
                  </label>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {generatedDesign.design.layout.structure} with {generatedDesign.design.layout.areas?.join(', ')}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                <div className="flex items-center space-x-4">
                  <span className="text-xs px-2 py-1 rounded" style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}>
                    {generatedDesign.design?.components?.length || 0} Components
                  </span>
                  <span className="text-xs px-2 py-1 rounded" style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}>
                    {generatedDesign.variations || 3} Variations
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="text-xs px-3 py-1 rounded transition-colors flex items-center space-x-1"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                  >
                    <Download className="h-3 w-3" />
                    <span>Export</span>
                  </button>
                  <button 
                    className="text-xs px-3 py-1 rounded transition-colors flex items-center space-x-1"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                  >
                    <Save className="h-3 w-3" />
                    <span>Save Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Brief Content */}
          {viewMode === 'brief' && (
            <div 
              className="mb-6 p-4 rounded-lg border" 
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)' 
              }}
            >
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Project Brief
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Client
                  </label>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Global Banking Corp</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Project
                  </label>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>CBDC Implementation Strategy</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Objective
                  </label>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    Develop a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) solutions in the financial services sector.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Sections */}
          <div className="space-y-4 flex-1 overflow-y-auto">


            {/* Design Generation Section */}
            <div className="border rounded-lg" style={{ borderColor: 'var(--border-primary)' }}>
              <div 
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleSection('design')}
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <div className="flex items-center space-x-2">
                  {expandedSections.design ? (
                    <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  )}
                  <Layout className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Design Components</span>
                </div>
              </div>
              
              {expandedSections.design && (
                <div className="space-y-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  {designSections.map((section, index) => (
                    <div 
                      key={section.id} 
                      className="border rounded-lg p-4 transition-shadow"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border-secondary)'
                      }}
                      onMouseEnter={(e) => e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'}
                      onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <span className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {section.id}/{designSections.length}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                                {section.title}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(section.status)}`}>
                                {section.status}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              {section.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                          <button 
                            className="p-1.5 rounded transition-colors"
                            style={{ 
                              backgroundColor: 'transparent',
                              color: 'var(--text-secondary)'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1.5 rounded transition-colors"
                            style={{ 
                              backgroundColor: 'transparent',
                              color: 'var(--text-secondary)'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1.5 rounded transition-colors"
                            style={{ 
                              backgroundColor: 'transparent',
                              color: 'var(--text-secondary)'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Content Blocks */}
                      {section.blocks && section.blocks.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              Content Layouts
                            </h4>
                            <button 
                              className="text-xs px-2 py-1 rounded transition-colors flex items-center space-x-1"
                              style={{ 
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                            >
                              <PlusCircle className="h-3 w-3" />
                              <span>Add Layout</span>
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {section.blocks.map((block, blockIndex) => (
                              <div 
                                key={blockIndex} 
                                className="p-3 border rounded cursor-pointer transition-all hover:shadow-sm group" 
                                style={{ 
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderColor: 'var(--border-secondary)'
                                }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <Layout className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                                    <h5 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                      {block.type}
                                    </h5>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                    <button className="p-1 rounded hover:bg-gray-100">
                                      <Edit3 className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                                    </button>
                                    <button className="p-1 rounded hover:bg-gray-100">
                                      <Copy className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                                    </button>
                                  </div>
                                </div>
                                
                                {block.items && block.items.length > 0 ? (
                                  <div className="space-y-1">
                                    {block.items.map((item, itemIndex) => (
                                      <div key={itemIndex} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        • {item}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>
                                    Click to configure layout
                                  </div>
                                )}
                                
                                {/* Layout preview indicator */}
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex space-x-1">
                                    {[1, 2, 3].map((dot, dotIndex) => (
                                      <div 
                                        key={dotIndex}
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ 
                                          backgroundColor: dotIndex < (block.items?.length || 1) ? 'var(--accent-primary)' : 'var(--border-secondary)'
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    {section.estimatedSlides || Math.ceil(Math.random() * 3) + 2} slides
                                  </span>
                                </div>
                              </div>
                            ))}
                            
                            {/* Add new layout option */}
                            <div 
                              className="p-3 border-2 border-dashed rounded cursor-pointer transition-all hover:border-solid flex flex-col items-center justify-center min-h-[100px]" 
                              style={{ 
                                borderColor: 'var(--border-secondary)',
                                backgroundColor: 'var(--bg-primary)'
                              }}
                            >
                              <PlusCircle className="h-6 w-6 mb-2" style={{ color: 'var(--text-secondary)' }} />
                              <span className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                                Add Content Layout
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Deliverable Metrics */}
              <div className="mt-8">
                <DeliverableMetrics 
                  metrics={{
                    pages_count: 45,
                    word_count: 12500,
                    reading_time_minutes: 50,
                    file_size_mb: 2.8,
                    views_count: 23,
                    download_count: 8,
                    last_viewed: '2024-01-15T14:30:00Z',
                    completion_percentage: 75
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (contentType === 'document') {
    return (
      <div className="flex-1 p-2 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Theme Toggle at top */}
          <div className="flex justify-end mb-4">
            {/* Empty theme toggle space */}
          </div>
          
          {/* Document Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {documentContent.title}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {documentContent.author}
              </p>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage <= 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange('next')}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button className="p-2 rounded hover:bg-gray-100">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Executive Summary */}
              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  {documentContent.content.executiveSummary.title}
                </h2>
                {documentContent.content.executiveSummary.paragraphs.map((paragraph, index) => (
                  <p key={index} className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {paragraph}
                  </p>
                ))}
              </section>

              {/* Key Finding */}
              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  {documentContent.content.keyFinding.title}
                </h2>
                <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {documentContent.content.keyFinding.description}
                </p>
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Phased Timeline:
                  </h3>
                  <ul className="space-y-2">
                    {documentContent.content.keyFinding.phases.map((phase, index) => (
                      <li key={index} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        • {phase}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {documentContent.content.keyFinding.conclusion}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      {/* Simple delete confirmation dialog */}
      {showDeleteConfirm ? (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center" 
          style={{ zIndex: 99999 }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="rounded-lg p-6 max-w-md w-full mx-4" 
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Trash2 className="h-6 w-6" style={{ color: 'var(--text-error)' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Delete Deliverable
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete "<strong style={{ color: 'var(--text-primary)' }}>{selectedItem?.title}</strong>"? 
              This will permanently remove the deliverable and all its content.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-md border transition-colors"
                style={{ 
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDeliverable}
                className="px-4 py-2 rounded-md transition-colors"
                style={{ 
                  backgroundColor: 'var(--text-error)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* AI Design Generator Modal */}
      <DesignGenerator 
        isOpen={showDesignGenerator}
        onClose={() => setShowDesignGenerator(false)}
        onGenerate={handleDesignGenerate}
      />

      {/* Storyline Generation Modal */}
      <StorylineGenerationForm
        isOpen={showStorylineGenerator}
        onClose={() => setShowStorylineGenerator(false)}
        onGenerate={handleStorylineGenerate}
        isGenerating={isGenerating}
      />

      {/* Chat Toggle Button */}
      <button 
        onClick={() => setShowChat(!showChat)}
        className={`fixed bottom-6 right-6 z-40 px-6 py-3 rounded-full shadow-lg transition-all duration-300 ${
          showChat 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          transform: showChat ? 'scale(0.95)' : 'scale(1)'
        }}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">
            {showChat ? 'Close Chat' : 'AI Assistant'}
          </span>
        </div>
      </button>
      
      {/* Context-Aware Chat */}
      <ProjectAwareChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentProject={selectedItem?.type === 'project' ? selectedItem : null}
        userId={null} // Will be replaced with Auth0 user ID later
      />
      
    </>
  );
}
