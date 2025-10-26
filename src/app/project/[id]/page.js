'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Calendar, MoreHorizontal, Plus, FileText } from 'lucide-react';
import { normalizeId, getIdString } from '../../../lib/utils/idUtils';
import { useMenuManager } from '../../../lib/hooks/useMenuManager';
import LeftNav from '../../../components/layout/LeftNav';
import RightSection from '../../../components/layout/RightSection';

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

const findProjectIdInMenu = async (targetId) => {
  try {
    const response = await fetch('/api/menu');
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const rootItems = data?.rootItems || [];
    const stack = [...rootItems];

    while (stack.length > 0) {
      const item = stack.pop();
      const itemId = getIdString(item);

      if (itemId && itemId === targetId) {
        const meta = item.metadata || {};
        const candidate = getIdString(
          meta.project_id ||
          meta.projectId ||
          meta.business_entity_id ||
          item.project ||
          item.projectId
        );
        return candidate || null;
      }

      if (Array.isArray(item?.children) && item.children.length > 0) {
        stack.push(...item.children);
      }
    }
  } catch (error) {
    console.error('Error resolving project ID from menu:', error);
  }

  return null;
};

const normalizeProjectMenuItem = (item) => {
  if (!item) return item;

  const originalMetadata = item.metadata || {};
  const projectEntityId = getIdString(
    originalMetadata.project_id ||
    originalMetadata.projectId ||
    originalMetadata.business_entity_id ||
    item.project ||
    item.projectId ||
    item._id ||
    item.id
  );

  return {
    ...item,
    type: 'project',
    id: item._id || item.id,
    _id: item._id || item.id,
    parentId: item.parentId || null,
    metadata: {
      ...originalMetadata,
      project_id: originalMetadata.project_id || projectEntityId,
      business_entity_id: originalMetadata.business_entity_id || projectEntityId
    },
    projectEntityId
  };
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
    client_owner: rawProject.client_owner || clientOwnerId || '',
    internal_owner: rawProject.internal_owner || internalOwnerId || '',
    budget_amount: Number(budgetAmount) || 0,
    budget_currency: budgetCurrency,
    budget_type: budgetType,
    deliverables_count: rawProject.deliverables_count ?? rawProject.deliverables?.length ?? 0
  };
};

const ProjectDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const rawProjectId = params.id;

  const [project, setProject] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDeliverables, setExpandedDeliverables] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [actualProjectId, setActualProjectId] = useState(rawProjectId);
  const [selectedMenuProject, setSelectedMenuProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    menuStructure,
    isLoading: menuLoading,
    refreshFromDatabase,
    toggleCollapse,
    expandItem,
    collapseItem
  } = useMenuManager();

  useEffect(() => {
    refreshFromDatabase();
  }, [refreshFromDatabase]);

  useEffect(() => {
    if (!rawProjectId) return;
    if (menuLoading && (!menuStructure || menuStructure.length === 0)) return;

    const stack = [...(menuStructure || [])];
    let matched = null;

    while (stack.length > 0) {
      const item = stack.pop();
      if (!item) continue;

      const meta = item.metadata || {};
      const candidateIds = [
        getIdString(item._id || item.id),
        getIdString(meta.project_id),
        getIdString(meta.projectId),
        getIdString(meta.business_entity_id)
      ].filter(Boolean);

      if ((item.type === 'project' || meta.type === 'project') && candidateIds.includes(rawProjectId)) {
        matched = item;
        break;
      }

      if (Array.isArray(item.children) && item.children.length > 0) {
        stack.push(...item.children);
      }
    }

    if (matched) {
      const normalized = normalizeProjectMenuItem(matched);
      setSelectedMenuProject(prev => (prev?._id === normalized._id ? prev : normalized));

      const entityId = normalized.projectEntityId || rawProjectId;
      setActualProjectId(prev => (prev === entityId ? prev : entityId));

      if (normalized.parentId) {
        expandItem(normalized.parentId);
      }
    } else {
      setSelectedMenuProject(null);
      setActualProjectId(prev => (prev === rawProjectId ? prev : rawProjectId));
    }
  }, [rawProjectId, menuStructure, menuLoading, expandItem]);

  useEffect(() => {
    const fetchProjectData = async (requestedId, allowFallback) => {
      try {
        setLoading(true);

        let activeProjectId = requestedId;
        let projectResponse = await fetch(`/api/projects/${activeProjectId}`);

        if (!projectResponse.ok) {
          if (allowFallback && projectResponse.status === 404) {
            const fallbackId = await findProjectIdInMenu(activeProjectId);
            if (fallbackId && fallbackId !== activeProjectId) {
              setActualProjectId(fallbackId);
              return;
            }
          }

          throw new Error(`Failed to fetch project: ${projectResponse.status}`);
        }

        const projectJson = await projectResponse.json();
        const projectPayload = projectJson?.data?.project || projectJson?.data || projectJson;
        setProject(formatProjectResponse(projectPayload));

        const deliverablesResponse = await fetch(`/api/projects/${activeProjectId}/deliverables`);
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
        setError(err.message || 'Failed to fetch project');
      } finally {
        setLoading(false);
      }
    };

    if (actualProjectId) {
      const allowFallback = rawProjectId === actualProjectId;
      fetchProjectData(actualProjectId, allowFallback);
    }
  }, [actualProjectId, rawProjectId]);

  const handleUpdateProject = async (updates) => {
    try {
      if (!actualProjectId) {
        throw new Error('Cannot update project: unresolved project identifier');
      }

      const response = await fetch(`/api/projects/${actualProjectId}`, {
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

  const selectedItemForLayout = useMemo(() => {
    if (selectedMenuProject) {
      return selectedMenuProject;
    }

    if (project) {
      const projectId = getIdString(project._id || project.id);
      return {
        type: 'project',
        id: projectId,
        _id: projectId,
        title: project.name,
        name: project.name,
        metadata: {
          project_id: projectId,
          business_entity_id: projectId
        }
      };
    }

    return null;
  }, [selectedMenuProject, project]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-full p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading project details...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-full p-6">
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
        <div className="flex items-center justify-center min-h-full p-6">
          <p className="text-gray-500">Project not found</p>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {project.name || 'Untitled Project'}
            </h1>

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

            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Client Owner</label>
                  <select
                    value={project.client_owner?._id || project.client_owner || ''}
                    onChange={(e) => handleUpdateProject({ client_owner: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select client owner</option>
                    {contacts.length > 0 ? contacts.map(contact => (
                      <option key={getIdString(contact)} value={getIdString(contact)}>
                        {contact.name || contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
                      </option>
                    )) : (
                      <option value="" disabled>Loading contacts...</option>
                    )}
                  </select>
                  {project.client_owner?.name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {project.client_owner.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Internal Owner</label>
                  <select
                    value={project.internal_owner?._id || project.internal_owner || ''}
                    onChange={(e) => handleUpdateProject({ internal_owner: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select internal owner</option>
                    {users.length > 0 ? users.map(user => {
                      const label = user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email_address;
                      return (
                        <option key={getIdString(user)} value={getIdString(user)}>
                          {label}
                        </option>
                      );
                    }) : (
                      <option value="" disabled>Loading users...</option>
                    )}
                  </select>
                  {project.internal_owner?.first_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {project.internal_owner.first_name} {project.internal_owner.last_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Budget</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Amount</label>
                  <input
                    type="number"
                    value={project.budget_amount || 0}
                    onChange={(e) => handleUpdateProject({ budget_amount: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

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
                  {deliverables.map((deliverable) => {
                    const deliverableId = getIdString(deliverable);
                    const navigateToDeliverable = () => {
                      if (!deliverableId) return;
                      router.push(`/deliverable/${deliverableId}`);
                    };

                    const handleKeyDown = (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigateToDeliverable();
                      }
                    };

                    return (
                      <div
                        key={deliverableId}
                        role="button"
                        tabIndex={0}
                        onClick={navigateToDeliverable}
                        onKeyDown={handleKeyDown}
                        className="flex items-center justify-between py-4 px-6 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-base">{deliverable.name}</h4>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                            {deliverable.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}

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

  return (
    <div className="h-screen flex overflow-hidden">
      <LeftNav
        onToggle={() => {}}
        menuStructure={menuStructure && menuStructure.length > 0 ? menuStructure : undefined}
        isLoading={typeof menuLoading === 'boolean' ? menuLoading : undefined}
        refreshFromDatabase={refreshFromDatabase}
        toggleCollapse={toggleCollapse}
        expandItem={expandItem}
        collapseItem={collapseItem}
        onItemSelect={() => {}}
        onModalStateChange={setIsModalOpen}
        selectedItem={selectedItemForLayout}
      />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-auto bg-gray-50">
          {renderContent()}
        </div>

        <RightSection
          isModalOpen={isModalOpen}
          selectedItem={selectedItemForLayout}
          showLayoutOptions={false}
          selectedLayout="default"
          onLayoutChange={() => {}}
          storyline={null}
          onApplyLayoutToAll={() => {}}
        />
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
