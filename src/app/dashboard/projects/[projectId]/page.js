'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  DollarSign, 
  User, 
  Building, 
  MoreHorizontal,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { normalizeId, getIdString } from '@/lib/utils/idUtils';

const toDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
};

const resolveEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const nested = value._id || value.id;
    if (nested) {
      if (typeof nested === 'string') return nested;
      if (typeof nested === 'object' && typeof nested.toString === 'function') {
        const nestedString = nested.toString();
        return nestedString === '[object Object]' ? '' : nestedString;
      }
      return nested;
    }
    if (typeof value.toString === 'function') {
      const asString = value.toString();
      return asString === '[object Object]' ? '' : asString;
    }
  }
  return '';
};

const DELIVERABLE_TYPE_LABELS = {
  presentation: 'Presentation',
  deck: 'Presentation',
  slides: 'Presentation',
  report: 'Report',
  strategy: 'Strategy',
  roadmap: 'Strategy',
  plan: 'Strategy',
  dashboard: 'Dashboard',
  api: 'API',
  integration: 'API',
  analysis: 'Analysis',
  assessment: 'Analysis',
  brief: 'Brief',
  storyline: 'Storyline',
  documentation: 'Documentation',
  document: 'Documentation',
  manual: 'Documentation',
  design: 'Design',
  prototype: 'Design',
  code: 'Code'
};

const formatDeliverableTypeValue = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') {
    return null;
  }

  const cleaned = rawValue.replace(/[_-]/g, ' ').trim();
  if (!cleaned) {
    return null;
  }

  const lower = cleaned.toLowerCase();

  if (lower === 'deliverable') {
    return null;
  }

  if (DELIVERABLE_TYPE_LABELS[lower]) {
    return DELIVERABLE_TYPE_LABELS[lower];
  }

  const contains = (keyword) => lower.includes(keyword);

  if (contains('deck') || contains('presentation')) return 'Presentation';
  if (contains('roadmap') || contains('plan')) return 'Strategy';
  if (contains('dashboard')) return 'Dashboard';
  if (contains('api')) return 'API';
  if (contains('report') || contains('summary')) return 'Report';
  if (contains('analysis') || contains('assessment')) return 'Analysis';
  if (contains('brief')) return 'Brief';
  if (contains('storyline')) return 'Storyline';
  if (contains('design') || contains('mockup')) return 'Design';
  if (contains('doc')) return 'Documentation';
  if (contains('code') || contains('implementation')) return 'Code';

  return cleaned
    .split(' ')
    .map(word => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}` : ''))
    .join(' ')
    .trim();
};

const resolveDeliverableType = (deliverable) => {
  if (!deliverable) {
    return 'Other';
  }

  const candidates = [
    deliverable.type,
    deliverable.metadata?.type,
    deliverable.metadata?.category,
    deliverable.metadata?.deliverableType,
    deliverable.category,
    deliverable.kind,
    deliverable.format
  ];

  for (const candidate of candidates) {
    const formatted = formatDeliverableTypeValue(candidate);
    if (formatted) {
      return formatted;
    }
  }

  return 'Other';
};

const formatProjectResponse = (rawProject) => {
  if (!rawProject) return null;

  const normalized = normalizeId(rawProject);
  const clientOwnerId = resolveEntityId(rawProject.client_owner);
  const internalOwnerId = resolveEntityId(rawProject.internal_owner);
  const budgetAmount = rawProject?.budget?.amount ?? rawProject?.budget_amount ?? 0;
  const budgetCurrency = rawProject?.budget?.currency ?? rawProject?.currency ?? rawProject?.budget_currency ?? 'USD';
  const budgetType = rawProject?.budget?.type ?? rawProject?.budget_type ?? 'Fixed';

  return {
    ...normalized,
    status: rawProject.status || 'Planning',
    start_date: toDateInputValue(rawProject.start_date),
    end_date: toDateInputValue(rawProject.end_date),
    client_owner: clientOwnerId || '',
    client_owner_name: typeof rawProject.client_owner === 'object' ? rawProject.client_owner.name : null,
    internal_owner: internalOwnerId || '',
    internal_owner_name: typeof rawProject.internal_owner === 'object'
      ? [rawProject.internal_owner.first_name, rawProject.internal_owner.last_name].filter(Boolean).join(' ')
      : null,
    budget_amount: Number(budgetAmount) || 0,
    budget_currency: budgetCurrency,
    budget_type: budgetType,
    deliverables_count: rawProject.deliverables_count ?? rawProject.deliverables?.length ?? 0
  };
};

const ProjectDetailsPage = () => {
  const params = useParams();
  const projectId = params.projectId;
  
  const [project, setProject] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDeliverables, setExpandedDeliverables] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch project details
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          throw new Error(`Failed to fetch project: ${projectResponse.status}`);
        }
        const projectJson = await projectResponse.json();
        const projectPayload = projectJson?.data?.project || projectJson?.data || projectJson;
        setProject(formatProjectResponse(projectPayload));

        // Fetch deliverables
        const deliverablesResponse = await fetch(`/api/projects/${projectId}/deliverables`);
        if (deliverablesResponse.ok) {
          const deliverablesJson = await deliverablesResponse.json();
          const deliverablesList = Array.isArray(deliverablesJson)
            ? deliverablesJson
            : deliverablesJson?.data?.deliverables || deliverablesJson?.deliverables || [];
          const normalizedDeliverables = deliverablesList.map((item) => {
            const normalized = normalizeId(item);
            return {
              ...normalized,
              metadata: item.metadata || normalized.metadata || {},
              type: resolveDeliverableType(item)
            };
          });
          setDeliverables(normalizedDeliverables);
        } else {
          setDeliverables([]);
        }

        // Fetch contacts and users for dropdowns
        const [contactsRes, usersRes] = await Promise.all([
          fetch('/api/contacts'),
          fetch('/api/users')
        ]);

        if (contactsRes.ok) {
          const contactsJson = await contactsRes.json();
          const contactList = contactsJson?.data?.contacts || contactsJson?.contacts || [];
          setContacts(contactList.map(normalizeId));
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const userList = usersData?.data?.users || usersData?.users || [];
          setUsers(userList.map(normalizeId));
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const handleUpdateProject = async (updates) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const data = await response.json();
      const projectPayload = data?.data?.project || data?.data || data;
      setProject(formatProjectResponse(projectPayload));
    } catch (err) {
      console.error('Error updating project:', err);
    }
  };

  const statusOptions = [
    { value: 'Planning', label: 'Planning' },
    { value: 'Active', label: 'Active' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'CHF', label: 'CHF' }
  ];

  const budgetTypeOptions = [
    { value: 'Fixed', label: 'Fixed' },
    { value: 'Hourly', label: 'Hourly' },
    { value: 'Retainer', label: 'Retainer' },
    { value: 'Milestone', label: 'Milestone' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading project: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {project.name || 'Untitled Project'}
          </h1>
          
          {/* Description Section */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Description</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed text-base mb-4">
                {project.description || 'No description provided.'}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <FileText className="w-4 h-4 mr-2" />
                From: Client Brief Document
              </div>
            </div>
          </div>

          {/* Project Metadata Grid */}
          <div className="mb-8">
            {/* Status, Start Date, End Date in one line */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
                <select
                  value={project.status || 'Planning'}
                  onChange={(e) => handleUpdateProject({ status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={project.start_date || ''}
                    onChange={(e) => handleUpdateProject({ start_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={project.end_date || ''}
                    onChange={(e) => handleUpdateProject({ end_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Client Owner, Internal Owner in second line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Owner */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Client Owner</label>
                <select
                  value={project.client_owner || ''}
                  onChange={(e) => handleUpdateProject({ client_owner: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select client contact...</option>
                  {contacts.map(contact => (
                    <option key={getIdString(contact)} value={getIdString(contact)}>
                      {contact.name || contact.email_address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Internal Owner */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Internal Owner</label>
                <select
                  value={project.internal_owner || ''}
                  onChange={(e) => handleUpdateProject({ internal_owner: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select team member...</option>
                  {users.map(user => {
                    const label = user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email_address;
                    return (
                      <option key={getIdString(user)} value={getIdString(user)}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Budget Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Budget</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Amount</label>
                <input
                  type="number"
                  value={project.budget_amount || 0}
                  onChange={(e) => handleUpdateProject({ budget_amount: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Currency</label>
                <select
                  value={project.budget_currency || 'USD'}
                  onChange={(e) => handleUpdateProject({ budget_currency: e.target.value, currency: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {currencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Type</label>
                <select
                  value={project.budget_type || 'Fixed'}
                  onChange={(e) => handleUpdateProject({ budget_type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {budgetTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Deliverables Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => setExpandedDeliverables(!expandedDeliverables)}
              >
                {expandedDeliverables ? (
                  <ChevronDown className="w-5 h-5 text-gray-500 mr-2" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500 mr-2" />
                )}
                <h3 className="text-lg font-medium text-gray-700">Deliverables</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedDeliverables && (
              <div className="space-y-4">
                {deliverables.map((deliverable, index) => (
                  <div key={getIdString(deliverable)} className="flex items-center justify-between py-4 px-6 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-base">{deliverable.name}</h4>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                        {deliverable.type}
                      </span>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {deliverables.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No deliverables yet</p>
                    <p className="text-sm">Add deliverables to track project outputs</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
