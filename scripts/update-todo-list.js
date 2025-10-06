#!/usr/bin/env node

/**
 * TODO List Updater
 * 
 * This script automatically updates the TODO_IMPLEMENTATION_LIST.md file
 * after each feature implementation to track progress.
 * 
 * Usage: node scripts/update-todo-list.js [task-id] [status]
 * 
 * Examples:
 * - node scripts/update-todo-list.js "2.1" "completed"
 * - node scripts/update-todo-list.js "3.1" "in-progress"
 * - node scripts/update-todo-list.js "5.1" "completed"
 */

const fs = require('fs');
const path = require('path');

// Status mapping
const STATUS_MAPPING = {
  'completed': { emoji: '✅', text: 'Completed' },
  'in-progress': { emoji: '🚧', text: 'In Progress' },
  'not-started': { emoji: '❌', text: 'Not Started' },
  'blocked': { emoji: '🚫', text: 'Blocked' }
};

function updateTodoList(taskId, status) {
  const todoFile = path.join(__dirname, '..', 'TODO_IMPLEMENTATION_LIST.md');
  
  if (!fs.existsSync(todoFile)) {
    console.error('❌ TODO_IMPLEMENTATION_LIST.md not found');
    process.exit(1);
  }

  const statusInfo = STATUS_MAPPING[status];
  if (!statusInfo) {
    console.error(`❌ Unknown status: ${status}`);
    console.error('Available statuses:', Object.keys(STATUS_MAPPING).join(', '));
    process.exit(1);
  }

  let content = fs.readFileSync(todoFile, 'utf8');
  
  // Update the task status
  const taskRegex = new RegExp(
    `(\\[ \\] \\*\\*${taskId}\\*\\*[^\\n]+\\n)`,
    'g'
  );
  
  content = content.replace(taskRegex, (match) => {
    if (status === 'completed') {
      return match.replace('[ ]', '[x]');
    }
    return match;
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
    const newNote = `- **${now}**: Task ${taskId} - ${statusInfo.text}`;
    const insertPoint = content.indexOf('\n### **Recent Implementations**') + 1;
    content = content.slice(0, insertPoint) + newNote + '\n' + content.slice(insertPoint);
  } else {
    // Add a new section if it doesn't exist
    const insertPoint = content.indexOf('## 🔄 **Update Process**');
    const newSection = `## 📝 **Recent Implementations**

- **${now}**: Task ${taskId} - ${statusInfo.text}

`;
    content = content.slice(0, insertPoint) + newSection + content.slice(insertPoint);
  }

  // Write the updated content
  fs.writeFileSync(todoFile, content);
  
  console.log(`✅ Updated Task ${taskId}: ${statusInfo.text}`);
  console.log(`📝 Updated TODO_IMPLEMENTATION_LIST.md`);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node scripts/update-todo-list.js [task-id] [status]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/update-todo-list.js "2.1" "completed"');
  console.log('  node scripts/update-todo-list.js "3.1" "in-progress"');
  console.log('  node scripts/update-todo-list.js "5.1" "completed"');
  console.log('');
  console.log('Statuses:');
  Object.keys(STATUS_MAPPING).forEach(status => {
    console.log(`  - ${status}: ${STATUS_MAPPING[status].text}`);
  });
  process.exit(1);
}

const [taskId, status] = args;
updateTodoList(taskId, status);
