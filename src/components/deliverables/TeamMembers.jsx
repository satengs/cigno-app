import React from 'react';

const TeamMembers = ({ members = [], maxDisplay = 3, showCount = true }) => {
  if (!members || members.length === 0) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Team:</span>
        <span className="text-sm text-gray-400">No team assigned</span>
      </div>
    );
  }

  const visibleMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'project manager':
        return 'bg-purple-100 text-purple-800';
      case 'consultant':
        return 'bg-blue-100 text-blue-800';
      case 'analyst':
        return 'bg-green-100 text-green-800';
      case 'specialist':
        return 'bg-orange-100 text-orange-800';
      case 'reviewer':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Team:</span>
        {showCount && (
          <span className="text-sm text-gray-500">
            {members.length} member{members.length === 1 ? '' : 's'}
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {visibleMembers.map((member, index) => (
          <div
            key={member.id || index}
            className="flex items-center space-x-2 bg-gray-50 rounded-lg px-2 py-1"
          >
            <div className="flex-shrink-0">
              {member.avatar ? (
                <img
                  className="h-6 w-6 rounded-full"
                  src={member.avatar}
                  alt={member.name}
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {getInitials(member.name)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {member.name}
              </p>
              {member.role && (
                <p className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getRoleColor(member.role)}`}>
                  {member.role}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-2 py-1">
            <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                +{remainingCount}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {remainingCount} more
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMembers;
