#!/usr/bin/env node

/**
 * Implementation Progress Updater
 * 
 * This script automatically updates the IMPLEMENTATION_PROGRESS.md file
 * after each feature implementation to keep track of progress.
 * 
 * Usage: node scripts/update-implementation-progress.js [feature] [status]
 * 
 * Examples:
 * - node scripts/update-implementation-progress.js "deliverable-management" "completed"
 * - node scripts/update-implementation-progress.js "storyline-editing" "in-progress"
 * - node scripts/update-implementation-progress.js "insights-management" "completed"
 */

const fs = require('fs');
const path = require('path');

// Feature mapping to task categories
const FEATURE_MAPPING = {
  'deliverable-management': {
    category: 'Deliverable Management',
    tasks: 8,
    description: 'Project management and deliverable tracking system'
  },
  'storyline-editing': {
    category: 'Storyline Editing',
    tasks: 11,
    description: 'Content creation and storyline management system'
  },
  'section-editing': {
    category: 'Section Editing',
    tasks: 18,
    description: 'Section content editing and management interface'
  },
  'insights-management': {
    category: 'Insights Management',
    tasks: 11,
    description: 'Knowledge management and insights system'
  },
  'section-design': {
    category: 'Section Design',
    tasks: 3,
    description: 'Visual layout and slide generation system'
  },
  'prompt-modal': {
    category: 'Prompt Modal',
    tasks: 7,
    description: 'AI interaction and brainstorming interface'
  },
  'deliverable-settings': {
    category: 'Deliverable Settings',
    tasks: 7,
    description: 'Advanced deliverable configuration and AI features'
  },
  'user-settings': {
    category: 'User Settings',
    tasks: 4,
    description: 'User profile and settings management'
  },
  'backend-security': {
    category: 'Backend & Security',
    tasks: 34,
    description: 'Security, monitoring, and administration features'
  },
  'data-models': {
    category: 'Data Models',
    tasks: 10,
    description: 'Database models and data structure updates'
  }
};

// Status mapping
const STATUS_MAPPING = {
  'completed': { emoji: '✅', text: 'Complete', progress: 100 },
  'in-progress': { emoji: '🚧', text: 'In Progress', progress: 50 },
  'not-started': { emoji: '❌', text: 'Not Started', progress: 0 }
};

function updateImplementationProgress(feature, status) {
  const progressFile = path.join(__dirname, '..', 'IMPLEMENTATION_PROGRESS.md');
  
  if (!fs.existsSync(progressFile)) {
    console.error('❌ IMPLEMENTATION_PROGRESS.md not found');
    process.exit(1);
  }

  const featureInfo = FEATURE_MAPPING[feature];
  if (!featureInfo) {
    console.error(`❌ Unknown feature: ${feature}`);
    console.error('Available features:', Object.keys(FEATURE_MAPPING).join(', '));
    process.exit(1);
  }

  const statusInfo = STATUS_MAPPING[status];
  if (!statusInfo) {
    console.error(`❌ Unknown status: ${status}`);
    console.error('Available statuses:', Object.keys(STATUS_MAPPING).join(', '));
    process.exit(1);
  }

  let content = fs.readFileSync(progressFile, 'utf8');
  
  // Update the progress table
  const tableRegex = new RegExp(
    `(\\|\\*\\*${featureInfo.category}\\*\\*\\s*\\|\\s*)(\\d+)(\\s*\\|\\s*)(\\d+)(\\s*\\|\\s*)([^|]+)(\\s*\\|\\s*)([^|]+)(\\s*\\|)`,
    'g'
  );
  
  const newProgress = statusInfo.progress;
  const newStatus = `${statusInfo.emoji} ${statusInfo.text}`;
  
  content = content.replace(tableRegex, (match, p1, p2, p3, p4, p5, p6, p7, p8) => {
    const currentImplemented = parseInt(p2);
    const total = parseInt(p4);
    const newImplemented = status === 'completed' ? total : Math.floor(total * newProgress / 100);
    
    return `${p1}${newImplemented}${p3}${total}${p5}**${newProgress}%**${p6}${newStatus}${p7}${p8}`;
  });

  // Update the feature section
  const sectionRegex = new RegExp(
    `(### \\*\\*${featureInfo.category}\\*\\*\\s*)([^\\n]+)(\\s*\\n)`,
    'g'
  );
  
  content = content.replace(sectionRegex, (match, p1, p2, p3) => {
    return `${p1}${newStatus} **${newProgress}% Complete (${Math.floor(featureInfo.tasks * newProgress / 100)}/${featureInfo.tasks} tasks)**${p3}`;
  });

  // Update the last updated timestamp
  const timestampRegex = /(\*Last Updated: )([^*]+)(\*)/;
  const now = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  content = content.replace(timestampRegex, `$1${now}$3`);

  // Add implementation note
  const notesSection = content.indexOf('### **Recent Implementations**');
  if (notesSection !== -1) {
    const newNote = `- **${now}**: ${featureInfo.description} - ${statusInfo.text}`;
    const insertPoint = content.indexOf('\n### **Recent Implementations**') + 1;
    content = content.slice(0, insertPoint) + newNote + '\n' + content.slice(insertPoint);
  }

  // Write the updated content
  fs.writeFileSync(progressFile, content);
  
  console.log(`✅ Updated ${featureInfo.category}: ${statusInfo.text} (${newProgress}%)`);
  console.log(`📝 Updated IMPLEMENTATION_PROGRESS.md`);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node scripts/update-implementation-progress.js [feature] [status]');
  console.log('');
  console.log('Features:');
  Object.keys(FEATURE_MAPPING).forEach(feature => {
    console.log(`  - ${feature}: ${FEATURE_MAPPING[feature].description}`);
  });
  console.log('');
  console.log('Statuses:');
  Object.keys(STATUS_MAPPING).forEach(status => {
    console.log(`  - ${status}: ${STATUS_MAPPING[status].text}`);
  });
  process.exit(1);
}

const [feature, status] = args;
updateImplementationProgress(feature, status);
