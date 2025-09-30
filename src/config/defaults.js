/**
 * Default Configuration and Sample Data
 * Provides default views, widgets, and layouts for the application
 */

// Default Home View Configuration
export const DEFAULT_HOME_VIEW = {
  title: 'Dashboard',
  description: 'Welcome to your Cigno dashboard. This view contains sample widgets to get you started.',
  layoutVersion: 1,
  layout: [
    // Text Widget - Welcome Message
    {
      id: 'welcome-text-widget',
      type: 'text',
      title: 'Welcome to Cigno',
      x: 0,
      y: 0,
      w: 6,
      h: 3,
      minW: 3,
      minH: 2,
      props: {
        title: 'Welcome to Cigno',
        content: `# Dashboard 📊

Your main workspace for monitoring and analysis.`,
        markdown: true,
        fontSize: '14px',
        textAlign: 'left',
        color: '#374151',
        backgroundColor: 'transparent',
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }
    },

    // Number Widget - Sample KPI
    {
      id: 'sample-kpi-widget',
      type: 'number',
      title: 'Sample KPI',
      x: 6,
      y: 0,
      w: 6,
      h: 3,
      minW: 3,
      minH: 2,
      props: {
        title: 'Sample KPI',
        value: 42,
        label: 'Active Users',
        format: 'number',
        prefix: '',
        suffix: '',
        decimalPlaces: 0,
        showTrend: true,
        trendValue: 12,
        trendDirection: 'up',
        trendPeriod: 'vs last month',
        fontSize: '32px',
        labelFontSize: '14px',
        color: '#111827',
        backgroundColor: 'transparent',
        textAlign: 'center',
        padding: '20px'
      }
    },

    // Chart Widget - Sample Chart
    {
      id: 'sample-chart-widget',
      type: 'chart',
      title: 'Sample Chart',
      x: 0,
      y: 3,
      w: 12,
      h: 5,
      minW: 4,
      minH: 3,
      props: {
        title: 'Sample Chart',
        chartType: 'line',
        series: [
          {
            name: 'Revenue',
            data: [12000, 15000, 18000, 22000, 25000, 28000, 32000]
          },
          {
            name: 'Expenses',
            data: [8000, 9000, 11000, 12000, 14000, 16000, 18000]
          }
        ],
        xAxis: {
          label: 'Month',
          data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
        },
        yAxis: {
          label: 'Amount ($)',
          min: 0,
          max: 35000
        },
        showLegend: true,
        showGrid: true,
        colors: ['#3b82f6', '#ef4444'],
        backgroundColor: 'transparent',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }
    }
  ]
};

// Default Widget Configurations by Type
export const DEFAULT_WIDGET_CONFIGS = {
  text: {
    title: 'Text Widget',
    content: 'This is a sample text widget. You can edit this content and customize the styling.',
    markdown: false,
    fontSize: '14px',
    textAlign: 'left',
    color: '#374151',
    backgroundColor: 'transparent',
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },

  number: {
    title: 'Number Widget',
    value: 0,
    label: 'Value',
    format: 'number',
    prefix: '',
    suffix: '',
    decimalPlaces: 0,
    showTrend: false,
    trendValue: 0,
    trendDirection: 'neutral',
    trendPeriod: 'vs last period',
    fontSize: '32px',
    labelFontSize: '14px',
    color: '#111827',
    backgroundColor: 'transparent',
    textAlign: 'center',
    padding: '20px'
  },

  chart: {
    title: 'Chart Widget',
    chartType: 'line',
    series: [],
    xAxis: {
      label: 'X Axis',
      data: []
    },
    yAxis: {
      label: 'Y Axis',
      min: 0,
      max: 100
    },
    showLegend: true,
    showGrid: true,
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px'
  }
};

// Default Menu Items
export const DEFAULT_MENU_ITEMS = [
  {
    title: 'Home',
    icon: '🏠',
    viewId: 'home', // This will be replaced with actual view ID
    order: 1,
    owner: 'default',
    teamId: 'default',
    permissions: ['read', 'write']
  },
  {
    title: 'Analytics',
    icon: '📊',
    viewId: null, // Will be created dynamically
    order: 2,
    owner: 'default',
    teamId: 'default',
    permissions: ['read', 'write']
  },
  {
    title: 'Settings',
    icon: '⚙️',
    viewId: null, // Will be created dynamically
    order: 3,
    owner: 'default',
    teamId: 'default',
    permissions: ['read']
  }
];

// Default View Templates
export const VIEW_TEMPLATES = {
  home: {
    title: 'Home Dashboard',
    description: 'Main dashboard with key metrics and overview',
    layout: DEFAULT_HOME_VIEW.layout
  },

  analytics: {
    title: 'Analytics Dashboard',
    description: 'Data analysis and reporting dashboard',
    layout: [
      {
        id: 'analytics-header',
        type: 'text',
        title: 'Analytics Overview',
        x: 0,
        y: 0,
        w: 12,
        h: 2,
        minW: 6,
        minH: 2,
        props: {
          title: 'Analytics Overview',
          content: '# Analytics Dashboard 📊\n\nTrack your key performance indicators and business metrics.',
          markdown: true,
          fontSize: '16px',
          textAlign: 'center',
          color: '#1f2937',
          backgroundColor: '#f3f4f6',
          padding: '20px',
          border: '1px solid #d1d5db',
          borderRadius: '8px'
        }
      },
      {
        id: 'metric-1',
        type: 'number',
        title: 'Total Revenue',
        x: 0,
        y: 2,
        w: 4,
        h: 3,
        minW: 3,
        minH: 2,
        props: {
          title: 'Total Revenue',
          value: 125000,
          label: 'This Month',
          format: 'currency',
          prefix: '$',
          suffix: '',
          decimalPlaces: 0,
          showTrend: true,
          trendValue: 8.5,
          trendDirection: 'up',
          trendPeriod: 'vs last month',
          fontSize: '28px',
          labelFontSize: '12px',
          color: '#059669',
          backgroundColor: '#ecfdf5',
          textAlign: 'center',
          padding: '16px'
        }
      },
      {
        id: 'metric-2',
        type: 'number',
        title: 'Active Users',
        x: 4,
        y: 2,
        w: 4,
        h: 3,
        minW: 3,
        minH: 2,
        props: {
          title: 'Active Users',
          value: 2847,
          label: 'Current',
          format: 'number',
          prefix: '',
          suffix: '',
          decimalPlaces: 0,
          showTrend: true,
          trendValue: 12,
          trendDirection: 'up',
          trendPeriod: 'vs last week',
          fontSize: '28px',
          labelFontSize: '12px',
          color: '#2563eb',
          backgroundColor: '#eff6ff',
          textAlign: 'center',
          padding: '16px'
        }
      },
      {
        id: 'metric-3',
        type: 'number',
        title: 'Conversion Rate',
        x: 8,
        y: 2,
        w: 4,
        h: 3,
        minW: 3,
        minH: 2,
        props: {
          title: 'Conversion Rate',
          value: 0.0234,
          label: 'Overall',
          format: 'percentage',
          prefix: '',
          suffix: '',
          decimalPlaces: 2,
          showTrend: true,
          trendValue: 0.0012,
          trendDirection: 'up',
          trendPeriod: 'vs last month',
          fontSize: '28px',
          labelFontSize: '12px',
          color: '#7c3aed',
          backgroundColor: '#faf5ff',
          textAlign: 'center',
          padding: '16px'
        }
      },
      {
        id: 'analytics-chart',
        type: 'chart',
        title: 'Performance Trends',
        x: 0,
        y: 5,
        w: 12,
        h: 6,
        minW: 8,
        minH: 4,
        props: {
          title: 'Performance Trends',
          chartType: 'line',
          series: [
            {
              name: 'Revenue',
              data: [45000, 52000, 48000, 61000, 58000, 72000, 68000, 75000, 82000, 78000, 85000, 92000]
            },
            {
              name: 'Users',
              data: [1200, 1350, 1280, 1500, 1420, 1680, 1600, 1750, 1850, 1780, 1920, 2100]
            }
          ],
          xAxis: {
            label: 'Month',
            data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          },
          yAxis: {
            label: 'Value',
            min: 0,
            max: 100000
          },
          showLegend: true,
          showGrid: true,
          colors: ['#10b981', '#3b82f6'],
          backgroundColor: 'transparent',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }
      }
    ]
  },

  settings: {
    title: 'Settings & Configuration',
    description: 'Application settings and user preferences',
    layout: [
      {
        id: 'settings-header',
        type: 'text',
        title: 'Settings',
        x: 0,
        y: 0,
        w: 12,
        h: 2,
        minW: 6,
        minH: 2,
        props: {
          title: 'Settings & Configuration',
          content: '# Settings Dashboard ⚙️\n\nConfigure your application preferences and manage your account.',
          markdown: true,
          fontSize: '16px',
          textAlign: 'center',
          color: '#1f2937',
          backgroundColor: '#f9fafb',
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }
      },
      {
        id: 'user-info',
        type: 'text',
        title: 'User Information',
        x: 0,
        y: 2,
        w: 6,
        h: 4,
        minW: 4,
        minH: 3,
        props: {
          title: 'User Information',
          content: `**Name:** John Doe  
**Email:** john.doe@example.com  
**Role:** Administrator  
**Last Login:** Today at 2:30 PM  
**Status:** Active`,
          markdown: true,
          fontSize: '14px',
          textAlign: 'left',
          color: '#374151',
          backgroundColor: '#ffffff',
          padding: '16px',
          border: '1px solid #d1d5db',
          borderRadius: '8px'
        }
      },
      {
        id: 'app-stats',
        type: 'text',
        title: 'Application Statistics',
        x: 6,
        y: 2,
        w: 6,
        h: 4,
        minW: 4,
        minH: 3,
        props: {
          title: 'Application Statistics',
          content: `**Total Views:** 12  
**Total Widgets:** 47  
**Storage Used:** 2.3 GB  
**Last Backup:** Yesterday  
**System Status:** Healthy`,
          markdown: true,
          fontSize: '14px',
          textAlign: 'left',
          color: '#374151',
          backgroundColor: '#ffffff',
          padding: '16px',
          border: '1px solid #d1d5db',
          borderRadius: '8px'
        }
      }
    ]
  }
};

// Default Layout Grid Settings
export const DEFAULT_GRID_CONFIG = {
  rowHeight: 30,
  margin: [8, 8],
  containerPadding: [0, 0],
  cols: {
    lg: 12,
    md: 12,
    sm: 6,
    xs: 4,
    xxs: 1
  },
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0
  }
};

// Default Theme Settings
export const DEFAULT_THEME = {
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#8b5cf6'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  }
};

// Export all defaults
export default {
  DEFAULT_HOME_VIEW,
  DEFAULT_WIDGET_CONFIGS,
  DEFAULT_MENU_ITEMS,
  VIEW_TEMPLATES,
  DEFAULT_GRID_CONFIG,
  DEFAULT_THEME
};
