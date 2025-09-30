'use client';

import { useState } from 'react';
import { 
  Users, 
  User, 
  Clock, 
  DollarSign, 
  Calendar,
  Edit3,
  Plus,
  Trash2
} from 'lucide-react';
import Button from './buttons/Button';

export default function StaffingInfo({ 
  staffing = [], 
  isEditable = false,
  onEdit = null,
  onAdd = null,
  onRemove = null,
  className = '' 
}) {
  const [showDetails, setShowDetails] = useState(false);

  const getRoleInfo = (role) => {
    switch (role) {
      case 'project_manager':
        return {
          label: 'Project Manager',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20',
          icon: Users
        };
      case 'consultant':
        return {
          label: 'Consultant',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          icon: User
        };
      case 'analyst':
        return {
          label: 'Analyst',
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          icon: User
        };
      case 'specialist':
        return {
          label: 'Specialist',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          icon: User
        };
      case 'reviewer':
        return {
          label: 'Reviewer',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          icon: User
        };
      default:
        return {
          label: 'Other',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          icon: User
        };
    }
  };

  const calculateTotalAllocation = () => {
    return staffing.reduce((total, member) => total + (member.allocation_percentage || 0), 0);
  };

  const calculateTotalCost = () => {
    return staffing.reduce((total, member) => {
      const hours = member.allocation_percentage ? (member.allocation_percentage / 100) * 40 : 0; // Assuming 40 hours/week
      const rate = member.hourly_rate || 0;
      return total + (hours * rate);
    }, 0);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Users className="w-5 h-5" />
          Project Staffing
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          {isEditable && onAdd && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdd}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-secondary)'
        }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Team Size</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {staffing.length}
          </div>
        </div>
        <div className="p-3 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-secondary)'
        }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Allocation</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {calculateTotalAllocation()}%
          </div>
        </div>
        <div className="p-3 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-secondary)'
        }}>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Weekly Cost</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ${calculateTotalCost().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Staffing List */}
      {staffing.length > 0 ? (
        <div className="space-y-2">
          {staffing.map((member, index) => {
            const roleInfo = getRoleInfo(member.role);
            const RoleIcon = roleInfo.icon;

            return (
              <div key={index} className="p-4 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Role Icon */}
                    <div className={`p-2 rounded-full ${roleInfo.bgColor}`}>
                      <RoleIcon className="w-4 h-4" style={{ color: roleInfo.color }} />
                    </div>

                    {/* Member Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {member.user?.first_name} {member.user?.last_name}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                      
                      {showDetails && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                          <div>
                            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Allocation:</span>
                            <span className="ml-1" style={{ color: 'var(--text-primary)' }}>
                              {member.allocation_percentage || 0}%
                            </span>
                          </div>
                          {member.hourly_rate && (
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Rate:</span>
                              <span className="ml-1" style={{ color: 'var(--text-primary)' }}>
                                ${member.hourly_rate}/hr
                              </span>
                            </div>
                          )}
                          {member.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Start:</span>
                              <span className="ml-1" style={{ color: 'var(--text-primary)' }}>
                                {new Date(member.start_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {member.end_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>End:</span>
                              <span className="ml-1" style={{ color: 'var(--text-primary)' }}>
                                {new Date(member.end_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {member.notes && showDetails && (
                        <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-medium">Notes:</span> {member.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {isEditable && (
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(member, index)}
                          className="p-1"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}
                      {onRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}>
          <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <div className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No team members assigned
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Add team members to start building your project team
          </div>
        </div>
      )}
    </div>
  );
}
