#!/usr/bin/env node

/**
 * UI Components Documentation Updater
 * 
 * This script automatically updates the UI_COMPONENTS.md file whenever
 * changes are made to the UI component library.
 * 
 * Usage:
 *   node scripts/update-ui-docs.js
 *   npm run update-docs
 */

const fs = require('fs');
const path = require('path');

// Component categories and their components
const COMPONENT_CATEGORIES = {
  'buttons': ['Button'],
  'modals': ['Modal'],
  'forms': ['Input', 'Textarea', 'Select', 'Radio', 'Checkbox', 'Toggle', 'Slider'],
  'feedback': ['Tag', 'Progress'],
  'layout': ['Card']
};

// Component features and descriptions
const COMPONENT_DETAILS = {
  'Button': {
    variants: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'],
    sizes: ['sm', 'md', 'lg', 'xl'],
    features: ['Loading', 'Disabled', 'With Icons', 'Full keyboard accessibility', 'Hover and focus states']
  },
  'Modal': {
    sizes: ['sm', 'md', 'lg', 'xl', 'full'],
    features: ['Backdrop click to close', 'Escape key support', 'Customizable header', 'Responsive design', 'Focus management']
  },
  'Input': {
    features: ['Left and right icon support', 'Validation states (error, success)', 'Helper text', 'Placeholder text', 'All HTML input types', 'Focus states with purple ring']
  },
  'Textarea': {
    features: ['Resizable (vertical only)', 'Validation states', 'Helper text', 'Placeholder text', 'Focus states', 'Minimum and maximum rows']
  },
  'Select': {
    features: ['Custom chevron icon', 'Placeholder text', 'Option groups', 'Validation states', 'Focus states', 'Keyboard navigation']
  },
  'Radio': {
    features: ['Group support', 'Labels', 'Validation states', 'Focus states', 'Accessible markup']
  },
  'Checkbox': {
    features: ['Labels', 'Validation states', 'Focus states', 'Accessible markup', 'Indeterminate state support']
  },
  'Toggle': {
    features: ['Smooth animations', 'Labels', 'Focus states', 'Accessible markup', 'ARIA checked state']
  },
  'Slider': {
    features: ['Custom thumb', 'Mark labels', 'Value display', 'Smooth animations', 'Focus states', 'Keyboard support']
  },
  'Tag': {
    variants: ['default', 'primary', 'success', 'warning', 'danger', 'info'],
    sizes: ['sm', 'md', 'lg'],
    features: ['6 color variants', 'Removable option', 'Multiple sizes', 'Hover effects', 'Focus states']
  },
  'Progress': {
    variants: ['default', 'success', 'warning', 'danger', 'info'],
    sizes: ['sm', 'md', 'lg', 'xl'],
    features: ['Multiple variants', 'Label support', 'Percentage display', 'Smooth animations', 'Multiple sizes']
  },
  'Card': {
    variants: ['default', 'elevated', 'outlined', 'filled'],
    padding: ['none', 'sm', 'default', 'lg', 'xl'],
    features: ['4 variants: default, elevated, outlined, filled', '5 padding options: none, sm, default, lg, xl', 'Responsive design', 'Hover effects', 'Shadow variations']
  }
};

// Size specifications
const SIZE_SPECS = {
  'Button': {
    'sm': '32px height, 12px padding',
    'md': '40px height, 16px padding',
    'lg': '48px height, 24px padding',
    'xl': '56px height, 32px padding'
  },
  'Modal': {
    'sm': 'max-width: 448px',
    'md': 'max-width: 672px',
    'lg': 'max-width: 896px',
    'xl': 'max-width: 1152px',
    'full': 'Full width with margins'
  }
};

// Variant descriptions
const VARIANT_DESCRIPTIONS = {
  'Button': {
    'primary': 'Purple background with white text',
    'secondary': 'Gray background with dark text',
    'outline': 'Transparent with purple border',
    'ghost': 'Transparent with hover effects',
    'danger': 'Red background for destructive actions',
    'success': 'Green background for positive actions'
  },
  'Tag': {
    'default': 'Gray',
    'primary': 'Purple',
    'success': 'Green',
    'warning': 'Yellow',
    'danger': 'Red',
    'info': 'Blue'
  },
  'Progress': {
    'default': 'Purple',
    'success': 'Green',
    'warning': 'Yellow',
    'danger': 'Red',
    'info': 'Blue'
  },
  'Card': {
    'default': 'Standard white background with subtle border',
    'elevated': 'Enhanced shadow for emphasis',
    'outlined': 'Stronger border for definition',
    'filled': 'Subtle background fill'
  }
};

function countComponents() {
  let total = 0;
  Object.values(COMPONENT_CATEGORIES).forEach(category => {
    total += category.length;
  });
  return total;
}

function generateComponentSection(componentName) {
  const details = COMPONENT_DETAILS[componentName];
  let section = `### ${componentName}\n`;
  
  if (details.features) {
    section += `${details.features.join('. ')}.\n\n`;
  }
  
  if (details.variants) {
    section += `**Variants:**\n`;
    details.variants.forEach(variant => {
      const description = VARIANT_DESCRIPTIONS[componentName]?.[variant] || '';
      section += `- \`${variant}\`: ${description}\n`;
    });
    section += '\n';
  }
  
  if (details.sizes) {
    section += `**Sizes:**\n`;
    details.sizes.forEach(size => {
      const spec = SIZE_SPECS[componentName]?.[size] || '';
      section += `- \`${size}\`: ${spec}\n`;
    });
    section += '\n';
  }
  
  return section;
}

function generateCategorySection(categoryName, components) {
  let section = `## ${getCategoryEmoji(categoryName)} ${getCategoryTitle(categoryName)}\n\n`;
  
  components.forEach(component => {
    section += generateComponentSection(component);
  });
  
  return section;
}

function getCategoryEmoji(categoryName) {
  const emojis = {
    'buttons': '🔘',
    'modals': '🪟',
    'forms': '📝',
    'feedback': '💬',
    'layout': '🏗️'
  };
  return emojis[categoryName] || '📦';
}

function getCategoryTitle(categoryName) {
  const titles = {
    'buttons': 'Button Components',
    'modals': 'Modal Components',
    'forms': 'Form Components',
    'feedback': 'Feedback Components',
    'layout': 'Layout Components'
  };
  return titles[categoryName] || categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
}

function updateDocumentation() {
  const totalComponents = countComponents();
  const totalCategories = Object.keys(COMPONENT_CATEGORIES).length;
  
  // Read the current documentation
  const docsPath = path.join(process.cwd(), 'UI_COMPONENTS.md');
  let content = fs.readFileSync(docsPath, 'utf8');
  
  // Update component count
  content = content.replace(
    /The Cigno UI component library consists of \*\*\d+ core components\*\* organized into \*\*\d+ categories\*\*:/,
    `The Cigno UI component library consists of **${totalComponents} core components** organized into **${totalCategories} categories**:`
  );
  
  // Update component list
  const componentListMatch = content.match(/- \*\*Buttons\*\*: \d+ component.*\n- \*\*Modals\*\*: \d+ component.*\n- \*\*Forms\*\*: \d+ component.*\n- \*\*Feedback\*\*: \d+ component.*\n- \*\*Layout\*\*: \d+ component.*/);
  if (componentListMatch) {
    const newComponentList = `- **Buttons**: ${COMPONENT_CATEGORIES.buttons.length} component${COMPONENT_CATEGORIES.buttons.length > 1 ? 's' : ''} with multiple variants
- **Modals**: ${COMPONENT_CATEGORIES.modals.length} component${COMPONENT_CATEGORIES.modals.length > 1 ? 's' : ''} with multiple sizes
- **Forms**: ${COMPONENT_CATEGORIES.forms.length} component${COMPONENT_CATEGORIES.forms.length > 1 ? 's' : ''} for data input
- **Feedback**: ${COMPONENT_CATEGORIES.feedback.length} component${COMPONENT_CATEGORIES.feedback.length > 1 ? 's' : ''} for user feedback
- **Layout**: ${COMPONENT_CATEGORIES.layout.length} component${COMPONENT_CATEGORIES.layout.length > 1 ? 's' : ''} for content containers`;
    
    content = content.replace(componentListMatch[0], newComponentList);
  }
  
  // Update last updated date
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
  content = content.replace(
    /\*\*Last Updated\*\*: .*/,
    `**Last Updated**: ${currentDate}`
  );
  
  // Update version and counts
  content = content.replace(
    /\*\*Version\*\*: .*\n\*\*Components\*\*: .*\n\*\*Categories\*\*: .*/,
    `**Version**: 1.0.0  
**Components**: ${totalComponents}  
**Categories**: ${totalCategories}`
  );
  
  // Write the updated documentation
  fs.writeFileSync(docsPath, content);
  
  console.log(`✅ UI Components documentation updated successfully!`);
  console.log(`📊 Total Components: ${totalComponents}`);
  console.log(`📁 Total Categories: ${totalCategories}`);
  console.log(`📅 Last Updated: ${currentDate}`);
}

// Run the updater
if (require.main === module) {
  try {
    updateDocumentation();
  } catch (error) {
    console.error('❌ Error updating documentation:', error.message);
    process.exit(1);
  }
}

module.exports = { updateDocumentation };
