/**
 * Dynamic Framework Renderer
 * Converts JSON responses from CFA-DEMO agents into HTML based on framework type
 */

// Framework-specific render configurations based on CFA-DEMO markdown files
const renderCapabilityAssessmentContent = (slideContent) => {
  if (!slideContent) return '';

  console.log('🔍 Capability Assessment Renderer - slideContent:', slideContent);

  let html = '<div class="capability-assessment-content">';

  if (slideContent.capability_comparison_table && slideContent.capability_comparison_table.rows && Array.isArray(slideContent.capability_comparison_table.rows)) {
    html += '<div class="capability-comparison-table mb-6">';
    html += '<h3 class="text-lg font-semibold mb-4">Capability Assessment Matrix</h3>';

    html += '<div class="overflow-x-auto">';
    html += '<table class="w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" style="min-width: 600px;">';
    html += '<thead class="bg-gray-50">';
    html += '<tr>';
    html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capability Type</th>';
    html += '<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Client Status</th>';
    html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competitor Comparison</th>';
    html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Assessment</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody class="bg-white divide-y divide-gray-200">';

    slideContent.capability_comparison_table.rows.forEach((row, index) => {
      const clientStatusColor = row.client_status === 'Green' ? 'text-green-600 bg-green-100'
        : row.client_status === 'Amber' ? 'text-yellow-600 bg-yellow-100'
        : 'text-red-600 bg-red-100';

      html += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;

      html += `<td class="px-4 py-3 text-sm font-medium text-gray-900">${row.capability_type || 'Unknown Capability'}</td>`;

      html += `<td class="px-4 py-3 text-center">`;
      if (row.client_status) {
        html += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clientStatusColor}">${row.client_status}</span>`;
      } else {
        html += '<span class="text-gray-400">N/A</span>';
      }
      html += '</td>';

      html += '<td class="px-4 py-3 text-sm text-gray-700">';
      if (row.competitor_categories && Array.isArray(row.competitor_categories)) {
        html += '<div class="space-y-2">';
        row.competitor_categories.forEach(competitor => {
          const competitorStatusColor = competitor.status === 'Green' ? 'text-green-600'
            : competitor.status === 'Amber' ? 'text-yellow-600'
            : 'text-red-600';

          html += '<div class="flex items-start space-x-2">';
          html += `<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${competitorStatusColor} bg-gray-100">${competitor.status}</span>`;
          html += '<div class="flex-1">';
          html += `<div class="text-xs font-medium text-gray-800">${competitor.category_name || 'Unknown Category'}</div>`;
          html += `<div class="text-xs text-gray-600">${competitor.rationale || 'No rationale provided'}</div>`;
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
      } else {
        html += '<span class="text-gray-400">No competitor data</span>';
      }
      html += '</td>';

      html += `<td class="px-4 py-3 text-sm text-gray-700">${row.overall_comment || 'No assessment available'}</td>`;

      html += '</tr>';
    });

    html += '</tbody>';
    html += '</table>';
    html += '</div>';
    html += '</div>';
  }

  if (slideContent.capability_types && Array.isArray(slideContent.capability_types)) {
    html += '<div class="capability-types-summary mt-6">';
    html += '<h3 class="text-lg font-semibold mb-4">Capability Types Assessed</h3>';
    html += '<div class="flex flex-wrap gap-2">';
    slideContent.capability_types.forEach(capability => {
      html += `<span class="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">${capability}</span>`;
    });
    html += '</div>';
    html += '</div>';
  }

  html += '</div>';
  return html;
};

const FRAMEWORK_RENDERERS = {
  market_sizing: {
    title: 'Market Sizing Analysis',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      console.log('🔍 Market Sizing Renderer - slideContent:', slideContent);
      console.log('🔍 Market Sizing Renderer - market_segments:', slideContent.market_segments);
      
      let html = '<div class="market-sizing-content">';
      
      // Market segments
      if (slideContent.market_segments) {
        html += '<div class="market-segments mb-6">';
        html += '<h3 class="text-lg font-semibold mb-4">Market Segments by Product</h3>';
        
        slideContent.market_segments.forEach(segment => {
          html += `<div class="segment mb-4 p-4 bg-gray-50 rounded-lg">`;
          html += `<h4 class="font-medium text-gray-800 mb-2">${segment.pillar}</h4>`;
          
          if (segment.products) {
            html += '<div class="products grid grid-cols-1 md:grid-cols-2 gap-4">';
            segment.products.forEach(product => {
              html += `<div class="product p-3 bg-white rounded border">`;
              html += `<h5 class="font-medium text-sm mb-2">${product.product_name}</h5>`;
              
              // Check for both possible field names
              const marketSizeData = product.market_size_chf_bn || product.market_size_local_bn;
              if (marketSizeData) {
                html += '<div class="market-size mb-2">';
                html += '<p class="text-xs text-gray-600 mb-1">Market Size (Bn)</p>';
                Object.entries(marketSizeData).forEach(([year, value]) => {
                  const isNA = value === 'N/A' || value === 'n/a';
                  const badgeClass = isNA 
                    ? 'bg-gray-100 text-gray-600' 
                    : 'bg-blue-100 text-blue-800';
                  const displayValue = isNA ? 'N/A' : value;
                  html += `<span class="inline-block ${badgeClass} text-xs px-2 py-1 rounded mr-1 mb-1">${year}: ${displayValue}</span>`;
                });
                html += '</div>';
              }
              
              if (product.cagr_2019_2030) {
                const isNA = product.cagr_2019_2030 === 'N/A' || product.cagr_2019_2030 === 'n/a';
                const cagrClass = isNA ? 'text-gray-500' : 'text-green-600';
                const cagrValue = isNA ? 'N/A' : product.cagr_2019_2030;
                html += `<p class="text-xs ${cagrClass} font-medium">CAGR: ${cagrValue}</p>`;
              }
              
              if (product.growth_drivers && product.growth_drivers.length > 0) {
                html += '<div class="growth-drivers mt-2">';
                html += '<p class="text-xs text-gray-600 mb-1">Growth Drivers:</p>';
                html += '<ul class="text-xs text-gray-700">';
                product.growth_drivers.forEach(driver => {
                  html += `<li class="ml-2">• ${driver}</li>`;
                });
                html += '</ul></div>';
              }
              
              html += '</div>';
            });
            html += '</div>';
          }
          
          html += '</div>';
        });
        
        html += '</div>';
      }
      
      // Total market
      if (slideContent.total_market) {
        html += '<div class="total-market mb-4">';
        html += '<h3 class="text-lg font-semibold mb-2">Total Market Size</h3>';
        html += '<div class="total-values flex flex-wrap gap-2">';
        Object.entries(slideContent.total_market).forEach(([year, value]) => {
          // Handle both number and string formats (with underscores)
          const displayValue = typeof value === 'string' 
            ? value.replace(/_/g, ',') 
            : value.toLocaleString();
          html += `<span class="bg-green-100 text-green-800 text-sm px-3 py-1 rounded font-medium">${year}: ${displayValue} Bn</span>`;
        });
        html += '</div></div>';
      }
      
      html += '</div>';
      return html;
    }
  },

  competitive_landscape: {
    title: 'Competitive Landscape Analysis',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      console.log('🔍 Competitive Landscape Renderer - slideContent:', slideContent);
      
      let html = '<div class="competitive-landscape-content">';
      
      // Handle both player_categories and competitive_landscape_table structures
      const competitiveCategories = slideContent.player_categories || slideContent.competitive_landscape_table;
      if (competitiveCategories && Array.isArray(competitiveCategories)) {
        html += '<div class="competitive-landscape-table mb-6">';
        html += '<h3 class="text-lg font-semibold mb-4">Competitive Landscape by Category</h3>';
        
        // Create a table for better organization
        html += '<div class="overflow-x-auto">';
        html += '<table class="w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" style="min-width: 600px;">';
        html += '<thead class="bg-gray-50">';
        html += '<tr>';
        html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>';
        html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Model</th>';
        html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threat Level</th>';
        html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Players</th>';
        html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlook</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody class="bg-white divide-y divide-gray-200">';
        
        competitiveCategories.forEach((category, index) => {
          const threatColor = category.threat_level === 'HIGH' ? 'text-red-600 bg-red-100' : 
                            category.threat_level === 'MEDIUM-HIGH' ? 'text-orange-600 bg-orange-100' : 
                            category.threat_level === 'MEDIUM' ? 'text-yellow-600 bg-yellow-100' : 
                            'text-green-600 bg-green-100';
          
          html += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
          
          // Category Name
          html += `<td class="px-4 py-3 text-sm font-medium text-gray-900">${category.category_name || category.competition_category || 'N/A'}</td>`;
          
          // Business Model Today
          html += `<td class="px-4 py-3 text-sm text-gray-700">${category.business_model_today || category.business_model_definition || 'N/A'}</td>`;
          
          // Threat Level
          html += `<td class="px-4 py-3 text-sm">`;
          if (category.threat_level) {
            html += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${threatColor}">${category.threat_level}</span>`;
          } else {
            html += '<span class="text-gray-400">N/A</span>';
          }
          html += `</td>`;
          
          // Key Players
          html += `<td class="px-4 py-3 text-sm text-gray-700">`;
          if (category.key_players && category.key_players.length > 0) {
            html += '<div class="flex flex-wrap gap-1">';
            category.key_players.forEach(player => {
              html += `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${player}</span>`;
            });
            html += '</div>';
          } else {
            html += '<span class="text-gray-400">N/A</span>';
          }
          html += `</td>`;
          
          // Future Outlook
          html += `<td class="px-4 py-3 text-sm text-gray-700">${category.future_outlook || category.category_outlook || 'N/A'}</td>`;
          
          html += `</tr>`;
        });
        
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
      }
      
      // Additional details section for each category
      const categoriesData = slideContent.competitive_landscape_table || slideContent.player_categories;
      if (categoriesData && Array.isArray(categoriesData)) {
        html += '<div class="category-details mt-6">';
        html += '<h3 class="text-lg font-semibold mb-4">Detailed Category Analysis</h3>';
        
        categoriesData.forEach((category, index) => {
          html += `<div class="category-detail mb-6 p-4 bg-gray-50 rounded-lg">`;
          html += `<h4 class="font-medium text-gray-800 mb-3">${category.competition_category || 'Unknown Category'}</h4>`;
          
          // Business Model Definition
          if (category.business_model_definition) {
            html += `<div class="mb-3">`;
            html += `<p class="text-sm font-medium text-gray-700 mb-1">Business Model:</p>`;
            html += `<p class="text-sm text-gray-600">${category.business_model_definition}</p>`;
            html += `</div>`;
          }
          
          // Category Outlook
          if (category.category_outlook) {
            html += `<div class="mb-3">`;
            html += `<p class="text-sm font-medium text-gray-700 mb-1">Future Outlook:</p>`;
            html += `<p class="text-sm text-gray-600">${category.category_outlook}</p>`;
            html += `</div>`;
          }
          
          // Additional details in a grid
          html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">`;
          
          if (category.player_type) {
            html += `<div><span class="font-medium text-gray-700">Player Type:</span> <span class="text-gray-600">${category.player_type}</span></div>`;
          }
          
          if (category.market_share_estimate) {
            html += `<div><span class="font-medium text-gray-700">Market Share:</span> <span class="text-gray-600">${category.market_share_estimate}%</span></div>`;
          }
          
          if (category.typical_fee_level) {
            html += `<div><span class="font-medium text-gray-700">Typical Fees:</span> <span class="text-gray-600">${category.typical_fee_level}</span></div>`;
          }
          
          if (category.technology_maturity) {
            html += `<div><span class="font-medium text-gray-700">Technology Maturity:</span> <span class="text-gray-600">${category.technology_maturity}</span></div>`;
          }
          
          if (category.value_chain_focus) {
            html += `<div><span class="font-medium text-gray-700">Value Chain Focus:</span> <span class="text-gray-600">${category.value_chain_focus}</span></div>`;
          }
          
          if (category.regulatory_exposure) {
            html += `<div><span class="font-medium text-gray-700">Regulatory Exposure:</span> <span class="text-gray-600">${category.regulatory_exposure}</span></div>`;
          }
          
          if (category.expected_consolidation) {
            html += `<div><span class="font-medium text-gray-700">Expected Consolidation:</span> <span class="text-gray-600">${category.expected_consolidation}</span></div>`;
          }
          
          if (category.strategic_relevance_for_client) {
            html += `<div class="md:col-span-2">`;
            html += `<span class="font-medium text-gray-700">Strategic Relevance:</span> <span class="text-gray-600">${category.strategic_relevance_for_client}</span>`;
            html += `</div>`;
          }
          
          html += `</div>`;
          html += `</div>`;
        });
        
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }
  },

  capability_benchmark: {
    title: 'Capability Assessment',
    renderSlideContent: renderCapabilityAssessmentContent
  },

  capabilities_assessment: {
    title: 'Capability Assessment',
    renderSlideContent: renderCapabilityAssessmentContent
  },

  key_industry_trends: {
    title: 'Key Industry Trends',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      console.log('🔍 Key Industry Trends Renderer - slideContent:', slideContent);
      
      let html = '<div class="key-industry-trends-content">';
      
      // Handle the market_trends_table structure from the AI agent
      if (slideContent.market_trends_table && slideContent.market_trends_table.columns && Array.isArray(slideContent.market_trends_table.columns)) {
        html += '<div class="market-trends-table mb-6">';
        html += '<h3 class="text-lg font-semibold mb-4">Key Market Trends</h3>';
        
        // Create a responsive grid layout for trends
        html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">';
        
        slideContent.market_trends_table.columns.forEach((trend, index) => {
          html += `<div class="trend-column p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">`;
          html += `<h4 class="font-medium text-gray-800 mb-3 text-sm">${trend.trend_name || 'Unknown Trend'}</h4>`;
          
          if (trend.bullets && Array.isArray(trend.bullets)) {
            html += '<ul class="space-y-2">';
            trend.bullets.forEach(bullet => {
              html += `<li class="text-xs text-gray-700 flex items-start">`;
              html += `<span class="text-blue-500 mr-2 mt-1">•</span>`;
              html += `<span>${bullet}</span>`;
              html += `</li>`;
            });
            html += '</ul>';
          }
          
          html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }
  },

  competitor_deep_dive: {
    title: 'Competitor Deep Dive',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      console.log('🔍 Competitor Deep Dive Renderer - slideContent:', slideContent);
      
      let html = '<div class="competitor-deep-dive-content">';
      
      // Handle the deep_dive_matrix structure from the AI agent
      if (slideContent.deep_dive_matrix && slideContent.deep_dive_matrix.columns && Array.isArray(slideContent.deep_dive_matrix.columns)) {
        html += '<div class="deep-dive-matrix mb-6">';
        html += '<h3 class="text-lg font-semibold mb-4">Competitor Deep Dive Analysis</h3>';
        
        // Create a two-column layout for Overview and Market Position
        html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">';
        
        slideContent.deep_dive_matrix.columns.forEach((column, columnIndex) => {
          html += `<div class="column p-4 bg-gray-50 rounded-lg">`;
          html += `<h4 class="font-medium text-gray-800 mb-4 text-center">${column.section || 'Section'}</h4>`;
          
          if (column.layers && Array.isArray(column.layers)) {
            // Overview section
            column.layers.forEach((layer, layerIndex) => {
              html += `<div class="layer mb-4 p-3 bg-white rounded border-l-4 border-blue-500">`;
              html += `<h5 class="font-medium text-gray-700 mb-2 text-sm">${layer.layer || 'Unknown Layer'}</h5>`;
              html += `<p class="text-sm text-gray-600">${layer.overview || 'No overview available'}</p>`;
              html += `</div>`;
            });
          }
          
          if (column.subsections && Array.isArray(column.subsections)) {
            // Market Position section
            column.subsections.forEach((subsection, subsectionIndex) => {
              html += `<div class="subsection mb-4 p-3 bg-white rounded border-l-4 border-green-500">`;
              html += `<h5 class="font-medium text-gray-700 mb-2 text-sm">${subsection.layer || 'Unknown Layer'}</h5>`;
              
              if (subsection.facts && Array.isArray(subsection.facts)) {
                html += '<div class="facts mb-2">';
                html += '<p class="text-xs font-medium text-gray-600 mb-1">Key Facts:</p>';
                html += '<ul class="text-xs text-gray-700 space-y-1">';
                subsection.facts.forEach(fact => {
                  html += `<li class="flex items-start">`;
                  html += `<span class="text-green-500 mr-2 mt-1">•</span>`;
                  html += `<span>${fact}</span>`;
                  html += `</li>`;
                });
                html += '</ul></div>';
              }
              
              if (subsection.key_figures && Array.isArray(subsection.key_figures)) {
                html += '<div class="key-figures">';
                html += '<p class="text-xs font-medium text-gray-600 mb-1">Key Figures:</p>';
                html += '<div class="flex flex-wrap gap-1">';
                subsection.key_figures.forEach(figure => {
                  html += `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${figure}</span>`;
                });
                html += '</div></div>';
              }
              
              html += `</div>`;
            });
          }
          
          html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
      }
      
      // Competitor name highlight
      if (slideContent.competitor_name) {
        html += '<div class="competitor-name-highlight mt-6 p-4 bg-blue-50 rounded-lg">';
        html += '<h3 class="text-lg font-semibold text-blue-800 mb-2">Focus Competitor</h3>';
        html += `<p class="text-blue-700 font-medium">${slideContent.competitor_name}</p>`;
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }
  },

  strategic_options: {
    title: 'Strategic Options',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      console.log('🔍 Strategic Options Renderer - slideContent:', slideContent);
      
      let html = '<div class="strategic-options-content">';
      
      // Handle the strategic_options_matrix structure from the AI agent
      if (slideContent.strategic_options_matrix && slideContent.strategic_options_matrix.columns && Array.isArray(slideContent.strategic_options_matrix.columns)) {
        html += '<div class="strategic-options-matrix mb-6">';
        html += '<h3 class="text-lg font-semibold mb-4">Strategic Options Matrix</h3>';
        
        // Create a responsive grid layout for strategic options
        html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        
        slideContent.strategic_options_matrix.columns.forEach((option, index) => {
          html += `<div class="strategic-option p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">`;
          html += `<h4 class="font-medium text-gray-800 mb-3 text-sm">${option.option_name || 'Unknown Option'}</h4>`;
          
          // Description
          if (option.description) {
            html += '<div class="mb-3">';
            html += '<p class="text-xs font-medium text-gray-700 mb-1">Description:</p>';
            html += `<p class="text-xs text-gray-600">${option.description}</p>`;
            html += '</div>';
          }
          
          // Impact
          if (option.impact) {
            html += '<div class="mb-3">';
            html += '<p class="text-xs font-medium text-gray-700 mb-1">Impact:</p>';
            html += `<p class="text-xs text-gray-600">${option.impact}</p>`;
            html += '</div>';
          }
          
          // Feasibility
          if (option.feasibility) {
            html += '<div class="mb-3">';
            html += '<p class="text-xs font-medium text-gray-700 mb-1">Feasibility:</p>';
            html += `<p class="text-xs text-gray-600">${option.feasibility}</p>`;
            html += '</div>';
          }
          
          html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }
  },

  deep_dive_strategic_option: {
    title: 'Strategic Option Deep Dive',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      console.log('🔍 Strategic Option Deep Dive Renderer - slideContent:', slideContent);
      
      let html = '<div class="strategic-option-deep-dive-content">';
      
      // Selected option highlight
      if (slideContent.selected_option) {
        html += '<div class="selected-option-highlight mb-6 p-4 bg-blue-50 rounded-lg">';
        html += '<h3 class="text-lg font-semibold text-blue-800 mb-2">Selected Strategic Option</h3>';
        html += `<p class="text-blue-700 font-medium">${slideContent.selected_option.option_name || 'Unknown Option'}</p>`;
        
        if (slideContent.selected_option.impact_level || slideContent.selected_option.effort_level) {
          html += '<div class="flex gap-4 mt-2 text-sm">';
          if (slideContent.selected_option.impact_level) {
            html += `<span class="text-gray-600">Impact: <span class="font-medium">${slideContent.selected_option.impact_level}</span></span>`;
          }
          if (slideContent.selected_option.effort_level) {
            html += `<span class="text-gray-600">Effort: <span class="font-medium">${slideContent.selected_option.effort_level}</span></span>`;
          }
          if (slideContent.selected_option.impact_effort_ratio) {
            html += `<span class="text-gray-600">Ratio: <span class="font-medium">${slideContent.selected_option.impact_effort_ratio}</span></span>`;
          }
          html += '</div>';
        }
        html += '</div>';
      }
      
      // Deep dive quadrant analysis
      if (slideContent.deep_dive_quadrant) {
        html += '<div class="deep-dive-quadrant mb-6">';
        html += '<h3 class="text-lg font-semibold mb-4">Four-Quadrant Analysis</h3>';
        
        // Create a 2x2 grid for the quadrants
        html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
        
        // Pros quadrant
        if (slideContent.deep_dive_quadrant.pros && Array.isArray(slideContent.deep_dive_quadrant.pros)) {
          html += '<div class="quadrant p-4 bg-green-50 rounded-lg border-l-4 border-green-500">';
          html += '<h4 class="font-medium text-green-800 mb-3">Pros</h4>';
          html += '<ul class="space-y-2">';
          slideContent.deep_dive_quadrant.pros.forEach(pro => {
            html += `<li class="text-sm text-green-700 flex items-start">`;
            html += `<span class="text-green-500 mr-2 mt-1">+</span>`;
            html += `<span>${pro}</span>`;
            html += `</li>`;
          });
          html += '</ul></div>';
        }
        
        // Cons quadrant
        if (slideContent.deep_dive_quadrant.cons && Array.isArray(slideContent.deep_dive_quadrant.cons)) {
          html += '<div class="quadrant p-4 bg-red-50 rounded-lg border-l-4 border-red-500">';
          html += '<h4 class="font-medium text-red-800 mb-3">Cons</h4>';
          html += '<ul class="space-y-2">';
          slideContent.deep_dive_quadrant.cons.forEach(con => {
            html += `<li class="text-sm text-red-700 flex items-start">`;
            html += `<span class="text-red-500 mr-2 mt-1">-</span>`;
            html += `<span>${con}</span>`;
            html += `</li>`;
          });
          html += '</ul></div>';
        }
        
        // Enablers quadrant
        if (slideContent.deep_dive_quadrant.enablers && Array.isArray(slideContent.deep_dive_quadrant.enablers)) {
          html += '<div class="quadrant p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">';
          html += '<h4 class="font-medium text-blue-800 mb-3">Enablers</h4>';
          html += '<ul class="space-y-2">';
          slideContent.deep_dive_quadrant.enablers.forEach(enabler => {
            html += `<li class="text-sm text-blue-700 flex items-start">`;
            html += `<span class="text-blue-500 mr-2 mt-1">✓</span>`;
            html += `<span>${enabler}</span>`;
            html += `</li>`;
          });
          html += '</ul></div>';
        }
        
        // Risks quadrant
        if (slideContent.deep_dive_quadrant.risks && Array.isArray(slideContent.deep_dive_quadrant.risks)) {
          html += '<div class="quadrant p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">';
          html += '<h4 class="font-medium text-yellow-800 mb-3">Risks</h4>';
          html += '<ul class="space-y-2">';
          slideContent.deep_dive_quadrant.risks.forEach(risk => {
            html += `<li class="text-sm text-yellow-700 flex items-start">`;
            html += `<span class="text-yellow-500 mr-2 mt-1">⚠</span>`;
            html += `<span>${risk}</span>`;
            html += `</li>`;
          });
          html += '</ul></div>';
        }
        
        html += '</div>';
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }
  },

  buy_vs_build: {
    title: 'Build vs Buy Analysis',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      console.log('🔍 Build vs Buy Renderer - slideContent:', slideContent);
      
      let html = '<div class="build-vs-buy-content">';
      
      // Selected option context
      if (slideContent.selected_option) {
        html += '<div class="selected-option-context mb-6 p-4 bg-gray-50 rounded-lg">';
        html += '<h3 class="text-lg font-semibold text-gray-800 mb-2">Strategic Context</h3>';
        html += `<p class="text-gray-700">${slideContent.selected_option}</p>`;
        html += '</div>';
      }
      
      // Build vs Buy matrix
      if (slideContent.build_vs_buy_matrix && slideContent.build_vs_buy_matrix.columns && Array.isArray(slideContent.build_vs_buy_matrix.columns)) {
        html += '<div class="build-vs-buy-matrix mb-6">';
        html += '<h3 class="text-lg font-semibold mb-4">Approach Comparison Matrix</h3>';
        
        // Create a table for better organization
        html += '<div class="overflow-x-auto">';
        html += '<table class="w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" style="min-width: 600px;">';
        html += '<thead class="bg-gray-50">';
        html += '<tr>';
        html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approach</th>';
        html += '<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Control</th>';
        html += '<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Speed</th>';
        html += '<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Investment</th>';
        html += '<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>';
        html += '<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fit</th>';
        html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pros & Cons</th>';
        html += '</tr>';
        html += '</thead>';
        html += '<tbody class="bg-white divide-y divide-gray-200">';
        
        slideContent.build_vs_buy_matrix.columns.forEach((approach, index) => {
          const controlColor = approach.strategic_control === 'High' ? 'text-green-600 bg-green-100' : 
                             approach.strategic_control === 'Medium' ? 'text-yellow-600 bg-yellow-100' : 
                             'text-red-600 bg-red-100';
          
          const speedColor = approach.speed_to_market === 'High' ? 'text-green-600 bg-green-100' : 
                           approach.speed_to_market === 'Medium' ? 'text-yellow-600 bg-yellow-100' : 
                           'text-red-600 bg-red-100';
          
          const investmentColor = approach.investment_required === 'High' ? 'text-red-600 bg-red-100' : 
                                approach.investment_required === 'Medium' ? 'text-yellow-600 bg-yellow-100' : 
                                'text-green-600 bg-green-100';
          
          const riskColor = approach.risk_level === 'High' ? 'text-red-600 bg-red-100' : 
                          approach.risk_level === 'Medium' ? 'text-yellow-600 bg-yellow-100' : 
                          'text-green-600 bg-green-100';
          
          const fitColor = approach.organizational_fit === 'High' ? 'text-green-600 bg-green-100' : 
                         approach.organizational_fit === 'Medium' ? 'text-yellow-600 bg-yellow-100' : 
                         'text-red-600 bg-red-100';
          
          html += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
          
          // Approach
          html += `<td class="px-4 py-3 text-sm font-medium text-gray-900">${approach.approach || 'Unknown Approach'}</td>`;
          
          // Strategic Control
          html += `<td class="px-4 py-3 text-center">`;
          if (approach.strategic_control) {
            html += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${controlColor}">${approach.strategic_control}</span>`;
          } else {
            html += '<span class="text-gray-400">N/A</span>';
          }
          html += `</td>`;
          
          // Speed to Market
          html += `<td class="px-4 py-3 text-center">`;
          if (approach.speed_to_market) {
            html += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${speedColor}">${approach.speed_to_market}</span>`;
          } else {
            html += '<span class="text-gray-400">N/A</span>';
          }
          html += `</td>`;
          
          // Investment Required
          html += `<td class="px-4 py-3 text-center">`;
          if (approach.investment_required) {
            html += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${investmentColor}">${approach.investment_required}</span>`;
          } else {
            html += '<span class="text-gray-400">N/A</span>';
          }
          html += `</td>`;
          
          // Risk Level
          html += `<td class="px-4 py-3 text-center">`;
          if (approach.risk_level) {
            html += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskColor}">${approach.risk_level}</span>`;
          } else {
            html += '<span class="text-gray-400">N/A</span>';
          }
          html += `</td>`;
          
          // Organizational Fit
          html += `<td class="px-4 py-3 text-center">`;
          if (approach.organizational_fit) {
            html += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fitColor}">${approach.organizational_fit}</span>`;
          } else {
            html += '<span class="text-gray-400">N/A</span>';
          }
          html += `</td>`;
          
          // Pros & Cons
          html += `<td class="px-4 py-3 text-sm text-gray-700">`;
          if (approach.pros && approach.cons) {
            html += '<div class="space-y-2">';
            html += '<div>';
            html += '<p class="text-xs font-medium text-green-600 mb-1">Pros:</p>';
            html += '<ul class="text-xs text-gray-600 space-y-1">';
            approach.pros.forEach(pro => {
              html += `<li class="flex items-start">`;
              html += `<span class="text-green-500 mr-1 mt-0.5">+</span>`;
              html += `<span>${pro}</span>`;
              html += `</li>`;
            });
            html += '</ul></div>';
            html += '<div>';
            html += '<p class="text-xs font-medium text-red-600 mb-1">Cons:</p>';
            html += '<ul class="text-xs text-gray-600 space-y-1">';
            approach.cons.forEach(con => {
              html += `<li class="flex items-start">`;
              html += `<span class="text-red-500 mr-1 mt-0.5">-</span>`;
              html += `<span>${con}</span>`;
              html += `</li>`;
            });
            html += '</ul></div>';
            html += '</div>';
          } else {
            html += '<span class="text-gray-400">No data</span>';
          }
          html += `</td>`;
          
          html += `</tr>`;
        });
        
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
      }
      
      // Final recommendation
      if (slideContent.final_recommendation) {
        html += '<div class="final-recommendation mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">';
        html += '<h3 class="text-lg font-semibold text-blue-800 mb-2">Final Recommendation</h3>';
        html += `<div class="mb-3">`;
        html += `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">`;
        html += `Decision: ${slideContent.final_recommendation.decision || 'Not specified'}`;
        html += `</span>`;
        html += `</div>`;
        if (slideContent.final_recommendation.justification) {
          html += `<p class="text-sm text-blue-700">${slideContent.final_recommendation.justification}</p>`;
        }
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }
  },

  product_roadmap: {
    title: 'Product Roadmap',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      console.log('🔍 Product Roadmap Renderer - slideContent:', slideContent);
      
      let html = '<div class="product-roadmap-content">';
      
      // Strategy context
      if (slideContent.selected_strategy || slideContent.strategic_option) {
        html += '<div class="strategy-context mb-6 p-4 bg-gray-50 rounded-lg">';
        html += '<h3 class="text-lg font-semibold text-gray-800 mb-2">Implementation Strategy</h3>';
        if (slideContent.selected_strategy) {
          html += `<p class="text-sm text-gray-600 mb-1"><strong>Approach:</strong> ${slideContent.selected_strategy}</p>`;
        }
        if (slideContent.strategic_option) {
          html += `<p class="text-sm text-gray-600"><strong>Strategic Option:</strong> ${slideContent.strategic_option}</p>`;
        }
        html += '</div>';
      }
      
      // Product roadmap matrix
      if (slideContent.product_roadmap_matrix && slideContent.product_roadmap_matrix.steps && Array.isArray(slideContent.product_roadmap_matrix.steps)) {
        html += '<div class="product-roadmap-matrix mb-6">';
        html += '<h3 class="text-lg font-semibold mb-4">Implementation Roadmap</h3>';
        
        // Create a timeline layout
        html += '<div class="space-y-6">';
        
        slideContent.product_roadmap_matrix.steps.forEach((step, index) => {
          const stepNumber = index + 1;
          const isEven = stepNumber % 2 === 0;
          
          html += '<div class="roadmap-step">';
          html += '<div class="flex items-start">';
          
          // Step number and timeline
          html += '<div class="flex-shrink-0 mr-4">';
          html += `<div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">${stepNumber}</div>`;
          html += '</div>';
          
          // Step content
          html += '<div class="flex-1">';
          html += '<div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">';
          
          // Major step title
          if (step.major_step) {
            html += `<h4 class="text-lg font-semibold text-gray-800 mb-3">${step.major_step}</h4>`;
          }
          
          // Sub-steps
          if (step.substeps && Array.isArray(step.substeps)) {
            html += '<div class="space-y-2">';
            step.substeps.forEach((substep, subIndex) => {
              html += '<div class="flex items-start">';
              html += `<span class="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">${subIndex + 1}</span>`;
              html += `<p class="text-sm text-gray-700 leading-relaxed">${substep}</p>`;
              html += '</div>';
            });
            html += '</div>';
          }
          
          html += '</div>';
          html += '</div>';
          html += '</div>';
          
          // Add connector line between steps (except for last step)
          if (index < slideContent.product_roadmap_matrix.steps.length - 1) {
            html += '<div class="flex justify-center">';
            html += '<div class="w-0.5 h-8 bg-gray-300"></div>';
            html += '</div>';
          }
          
          html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }
  },

  partnerships: {
    title: 'Partnership Strategy Analysis',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      let html = '<div class="partnership-strategy-content">';
      
      if (slideContent.partnership_categories) {
        html += '<div class="partnership-categories">';
        html += '<h3 class="text-lg font-semibold mb-4">Partnership Categories</h3>';
        
        slideContent.partnership_categories.forEach(category => {
          html += `<div class="category mb-6 p-4 bg-gray-50 rounded-lg">`;
          html += `<h4 class="font-medium text-gray-800 mb-2">${category.category_name}</h4>`;
          
          if (category.strategic_rationale) {
            html += `<p class="text-sm text-gray-700 mb-3">${category.strategic_rationale}</p>`;
          }
          
          if (category.partnership_model) {
            html += `<p class="text-sm text-blue-600 mb-2"><strong>Model:</strong> ${category.partnership_model}</p>`;
          }
          
          if (category.estimated_investment) {
            html += `<p class="text-sm text-green-600 mb-2"><strong>Investment:</strong> ${category.estimated_investment}</p>`;
          }
          
          if (category.timeline) {
            html += `<p class="text-sm text-orange-600 mb-3"><strong>Timeline:</strong> ${category.timeline}</p>`;
          }
          
          if (category.potential_partners && category.potential_partners.length > 0) {
            html += '<div class="potential-partners">';
            html += '<p class="text-sm font-medium text-gray-700 mb-2">Potential Partners:</p>';
            
            category.potential_partners.forEach(partner => {
              html += `<div class="partner mb-3 p-3 bg-white rounded border">`;
              html += `<h5 class="font-medium text-sm text-blue-800 mb-1">${partner.partner_name}</h5>`;
              
              if (partner.partner_description) {
                html += `<p class="text-xs text-gray-600 mb-1">${partner.partner_description}</p>`;
              }
              
              if (partner.value_proposition) {
                html += `<p class="text-xs text-gray-700 mb-1"><strong>Value:</strong> ${partner.value_proposition}</p>`;
              }
              
              if (partner.partnership_structure) {
                html += `<p class="text-xs text-gray-700 mb-1"><strong>Structure:</strong> ${partner.partnership_structure}</p>`;
              }
              
              if (partner.rationale) {
                html += `<p class="text-xs text-gray-700"><strong>Rationale:</strong> ${partner.rationale}</p>`;
              }
              
              html += '</div>';
            });
            
            html += '</div>';
          }
          
          html += '</div>';
        });
        
        html += '</div>';
      }
      
      // Recommended approach
      if (slideContent.recommended_approach) {
        html += '<div class="recommended-approach mt-6 p-4 bg-purple-50 rounded-lg">';
        html += '<h4 class="font-medium text-purple-800 mb-2">Recommended Approach</h4>';
        
        Object.entries(slideContent.recommended_approach).forEach(([phase, details]) => {
          if (phase !== 'rationale') {
            html += `<p class="text-sm text-purple-700 mb-1"><strong>${phase.replace('_', ' ').toUpperCase()}:</strong> ${details}</p>`;
          }
        });
        
        if (slideContent.recommended_approach.rationale) {
          html += `<p class="text-sm text-gray-700 mt-2">${slideContent.recommended_approach.rationale}</p>`;
        }
        
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }
  }
};

/**
 * Dynamic framework renderer that converts JSON to HTML based on framework type
 */
export function renderFrameworkContent(framework, slideContent, insights = [], citations = []) {
  console.log('🔍 renderFrameworkContent called with:', {
    framework,
    slideContentType: typeof slideContent,
    slideContentIsNull: slideContent === null,
    slideContentIsUndefined: slideContent === undefined,
    insightsLength: insights?.length || 0,
    citationsLength: citations?.length || 0
  });
  
  // Ensure insights and citations are arrays
  const safeInsights = Array.isArray(insights) ? insights : [];
  const safeCitations = Array.isArray(citations) ? citations : [];
  
  const renderer = FRAMEWORK_RENDERERS[framework];
  
  if (!renderer) {
    // Fallback for unknown frameworks - render content nicely instead of raw JSON
    console.log('📊 Using generic renderer for framework:', framework);
    return {
      title: slideContent?.title || framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      html: renderGenericSlideContent(slideContent),
      insights: safeInsights,
      citations: safeCitations
    };
  }
  
  console.log('📊 Using specific renderer for framework:', framework);
  try {
    // For specific renderers, prioritize slideContent.title over renderer.title
    const title = slideContent?.title || renderer.title;
    return {
      title: title,
      html: renderer.renderSlideContent(slideContent),
      insights: safeInsights,
      citations: safeCitations
    };
  } catch (error) {
    console.error('❌ Error in specific renderer, falling back to generic:', error);
    return {
      title: slideContent?.title || framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      html: renderGenericSlideContent(slideContent),
      insights: safeInsights,
      citations: safeCitations
    };
  }
}

/**
 * Render generic slide content in a user-friendly format
 */
function renderGenericSlideContent(slideContent) {
  // Enhanced null/undefined checking
  if (!slideContent || typeof slideContent !== 'object' || slideContent === null) {
    console.log('⚠️ renderGenericSlideContent: Invalid slideContent:', slideContent);
    return '<p class="text-gray-500 italic">No content available</p>';
  }

  let html = '';

  // Render title if available
  if (slideContent.title) {
    html += `<h3 class="text-lg font-semibold text-gray-900 mb-4">${slideContent.title}</h3>`;
  }

  // Safely get object keys with additional validation
  try {
    const keys = Object.keys(slideContent);
    console.log('🔍 renderGenericSlideContent keys:', keys);
    
    keys.forEach(key => {
      const value = slideContent[key];
      
      // Skip null/undefined values
      if (value === null || value === undefined) {
        console.log(`⚠️ Skipping null/undefined value for key: ${key}`);
        return;
      }
      
      // Check if it's an array of objects (table data)
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        html += renderTable(key, value);
      }
      // Check if it's a simple object with key-value pairs
      else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        html += renderKeyValueSection(key, value);
      }
      // Check if it's a string or number
      else if (typeof value === 'string' || typeof value === 'number') {
        html += renderTextSection(key, value);
      }
    });
  } catch (error) {
    console.error('❌ Error processing slideContent keys:', error);
    console.error('slideContent:', slideContent);
    return '<p class="text-red-500 italic">Error processing content</p>';
  }

  return html || '<p class="text-gray-500 italic">No structured content available</p>';
}

/**
 * Render a table from array data
 */
function renderTable(title, data) {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const titleFormatted = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  let html = `<div class="mb-6">
    <h4 class="text-md font-medium text-gray-800 mb-3">${titleFormatted}</h4>
    <div class="overflow-x-auto">
      <table class="w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" style="min-width: 600px;">
        <thead class="bg-gray-50">
          <tr>`;

  headers.forEach(header => {
    const headerFormatted = header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    html += `<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${headerFormatted}</th>`;
  });

  html += `</tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">`;

  data.forEach((row, index) => {
    html += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
    headers.forEach(header => {
      const cellValue = row[header];
      const displayValue = typeof cellValue === 'object' ? JSON.stringify(cellValue) : String(cellValue);
      html += `<td class="px-4 py-3 text-sm text-gray-900">${displayValue}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody>
      </table>
    </div>
  </div>`;

  return html;
}

/**
 * Render key-value section
 */
function renderKeyValueSection(title, data) {
  const titleFormatted = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  let html = `<div class="mb-4">
    <h4 class="text-md font-medium text-gray-800 mb-2">${titleFormatted}</h4>
    <div class="space-y-2">`;

  Object.keys(data).forEach(key => {
    const value = data[key];
    const keyFormatted = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    
    html += `<div class="flex">
      <span class="font-medium text-gray-700 w-1/3">${keyFormatted}:</span>
      <span class="text-gray-600 flex-1">${displayValue}</span>
    </div>`;
  });

  html += `</div>
  </div>`;

  return html;
}

/**
 * Render text section
 */
function renderTextSection(title, value) {
  const titleFormatted = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return `<div class="mb-4">
    <h4 class="text-md font-medium text-gray-800 mb-2">${titleFormatted}</h4>
    <p class="text-gray-600">${String(value)}</p>
  </div>`;
}

/**
 * Parse section response dynamically based on framework type
 */
export function parseSectionResponse(agentResult, framework, sectionIndex = 0) {
  console.log('');
  console.log('🔍 ========== PARSE SECTION RESPONSE START ==========');
  console.log(`Framework: ${framework}`);
  console.log(`Section Index: ${sectionIndex}`);
  console.log('Agent Result Type:', typeof agentResult);
  console.log('Agent Result Keys:', Object.keys(agentResult || {}));
  
  try {
    console.log('Full Agent Result:', JSON.stringify(agentResult, null, 2));
  } catch (e) {
    console.log('Agent Result (non-serializable):', agentResult);
  }
  
  // Initialize dynamic structure
  const parsedData = {
    id: `section_${(sectionIndex || 0) + 1}`,
    title: '',
    description: '',
    slideContent: {},
    insights: [],
    citations: [],
    takeaway: '',
    notes: '',
    charts: [],
    status: 'draft',
    order: (sectionIndex || 0) + 1,
    contentBlocks: [],
    locked: false,
    framework,
    generatedAt: new Date().toISOString(),
    source: 'framework-agent'
  };
  
  // Try to parse as JSON first (CFA-DEMO agents return pure JSON)
  if (agentResult.response && typeof agentResult.response === 'string') {
    console.log('📄 Found agentResult.response (string)');
    console.log('Response content (first 500 chars):', agentResult.response.substring(0, 500));
    
    try {
      const responseData = JSON.parse(agentResult.response);
      console.log('✅ Successfully parsed JSON response');
      console.log('Parsed Data Keys:', Object.keys(responseData));
      
      try {
        console.log('Parsed Response Data:', JSON.stringify(responseData, null, 2));
      } catch (e) {
        console.log('Parsed Response Data (non-serializable):', responseData);
      }
      
      // Extract slide content - check for nested framework structure first
      let slideContent = null;
      let insights = [];
      let citations = [];
      
      // Check if data is nested under framework name (e.g., responseData.market_sizing.slide_content)
      if (responseData[framework] && responseData[framework].slide_content) {
        console.log(`📊 Found nested data under framework: ${framework}`);
        console.log(`📊 Framework data:`, responseData[framework]);
        slideContent = responseData[framework].slide_content;
        insights = responseData[framework].insights || [];
        citations = responseData[framework].citations || [];
        console.log(`📊 Extracted slideContent:`, slideContent);
      }
      // Check for direct structure (responseData.slide_content)
      else if (responseData.slide_content) {
        console.log('📊 Found direct slide_content structure');
        slideContent = responseData.slide_content;
        insights = responseData.insights || [];
        citations = responseData.citations || [];
      }
      
      if (slideContent && typeof slideContent === 'object' && slideContent !== null) {
        parsedData.slideContent = slideContent;
        parsedData.insights = Array.isArray(insights) ? insights : [];
        parsedData.citations = Array.isArray(citations) ? citations : [];
        
        // Extract title from slide content
        if (slideContent.title) {
          parsedData.title = slideContent.title;
        }
      } else {
        console.log('⚠️ Invalid slideContent, using empty object:', slideContent);
        parsedData.slideContent = {};
        parsedData.insights = [];
        parsedData.citations = [];
      }
      
      // Extract description if available
      if (responseData.description) {
        parsedData.description = responseData.description;
      }
      
      // Extract takeaway if available
      if (responseData.takeaway) {
        parsedData.takeaway = responseData.takeaway;
      }
      
      // Extract notes if available
      if (responseData.notes) {
        parsedData.notes = responseData.notes;
      }
      
      // Generate charts from slide content if applicable
      if (slideContent) {
        parsedData.charts = generateChartsFromSlideContent(slideContent, framework, sectionIndex);
      }
      
    } catch (e) {
      console.log(`❌ Failed to parse JSON from agentResult.response:`, e.message);
      console.log('Response content that failed to parse (first 200 chars):', agentResult.response?.substring(0, 200));
      
      // Fallback: Try to extract JSON from the text (sometimes it's embedded)
      console.log('🔍 Attempting to extract JSON from text response...');
      let extractedData = null;
      
      if (agentResult.response) {
        // Try to find JSON in markdown code blocks
        const jsonMatch = agentResult.response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            extractedData = JSON.parse(jsonMatch[1]);
            console.log('✅ Extracted JSON from markdown code block');
          } catch (extractError) {
            console.log('❌ Failed to parse extracted JSON');
          }
        }
        
        // Try to find JSON object directly in text
        if (!extractedData) {
          const jsonObjectMatch = agentResult.response.match(/\{[\s\S]*"slide_content"[\s\S]*\}/);
          if (jsonObjectMatch) {
            try {
              extractedData = JSON.parse(jsonObjectMatch[0]);
              console.log('✅ Extracted JSON object from text');
            } catch (extractError) {
              console.log('❌ Failed to parse extracted JSON object');
            }
          }
        }
      }
      
      if (extractedData) {
        // Use extracted data from markdown or embedded JSON
        console.log('✅ Using extracted JSON data from AI response');
        
        // Check for nested framework structure in extracted data
        let slideContent = null;
        let insights = [];
        let citations = [];
        
        if (extractedData[framework] && extractedData[framework].slide_content) {
          console.log(`📊 Found nested data in extracted JSON under framework: ${framework}`);
          slideContent = extractedData[framework].slide_content;
          insights = extractedData[framework].insights || [];
          citations = extractedData[framework].citations || [];
        } else if (extractedData.slide_content) {
          console.log('📊 Found direct slide_content in extracted JSON');
          slideContent = extractedData.slide_content;
          insights = extractedData.insights || [];
          citations = extractedData.citations || [];
        }
        
        if (slideContent) {
          parsedData.slideContent = slideContent;
          parsedData.insights = insights;
          parsedData.citations = citations;
          if (slideContent.title) parsedData.title = slideContent.title;
          parsedData.charts = generateChartsFromSlideContent(slideContent, framework, sectionIndex);
          parsedData.status = 'generated'; // Mark as successfully generated
        }
      } else {
        // Check if AI explicitly said it couldn't do the task
        const responseText = (agentResult.response || '').toLowerCase();
        const isErrorResponse = responseText.includes('unable') || 
                               responseText.includes('cannot') || 
                               responseText.includes('error') ||
                               responseText.includes('failed') ||
                               responseText.startsWith('i was unable') ||
                               responseText.startsWith('i cannot');
        
        if (isErrorResponse) {
          // AI explicitly failed - use fallback
          console.log('⚠️ AI explicitly indicated failure. Marking for fallback data.');
          parsedData.status = 'fallback_used';
          parsedData.notes = `AI Response: ${agentResult.response?.substring(0, 200)}...`;
        } else {
          // AI returned plain text but didn't fail - try to use what we can
          console.log('⚠️ AI returned plain text (not explicit failure). Using minimal data.');
          parsedData.title = framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          parsedData.description = agentResult.response?.substring(0, 500) || 'No structured content returned';
          parsedData.status = 'partial'; // Not a complete failure, but not ideal
          parsedData.notes = 'AI returned plain text without structured JSON. Content may be incomplete.';
        }
      }
    }
  } else if (agentResult.data && typeof agentResult.data === 'object') {
    // Try direct data field (some agents return data directly)
    console.log('📦 Found agentResult.data (object)');
    console.log('Attempting to use data directly...');
    
    parsedData.slideContent = agentResult.data.slide_content || agentResult.data;
    parsedData.insights = agentResult.data.insights || [];
    parsedData.citations = agentResult.data.citations || [];
    parsedData.title = agentResult.data.title || agentResult.data.slide_content?.title || framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    parsedData.charts = generateChartsFromSlideContent(parsedData.slideContent, framework, sectionIndex);
    parsedData.status = 'generated'; // Mark as successfully generated from direct data field
    console.log('✅ Using AI data from agentResult.data field');
  } else {
    console.log('⚠️ No usable response found in agentResult');
    console.log('Checking alternative fields...');
    console.log('agentResult.content:', agentResult.content);
    console.log('agentResult itself type:', typeof agentResult);
    
    // Check if there's any content at all
    const contentText = agentResult.content || agentResult.message || '';
    if (contentText) {
      console.log('Found content in alternative field, using it');
      parsedData.title = framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      parsedData.description = contentText.substring(0, 500);
      parsedData.status = 'partial';
    } else {
      // Truly no data - use fallback
      console.log('❌ No data found anywhere in agent response. Marking for fallback.');
      parsedData.title = framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      parsedData.status = 'fallback_used';
      parsedData.notes = 'No data returned from AI agent. Using fallback content.';
    }
  }
  
  // Generate HTML using framework renderer
  console.log('🎨 Rendering framework content...');
  const rendered = renderFrameworkContent(parsedData.framework, parsedData.slideContent, parsedData.insights, parsedData.citations);
  parsedData.title = rendered.title;
  parsedData.html = rendered.html;
  
  console.log('');
  console.log('✅ ========== FINAL PARSED DATA ==========');
  try {
    console.log(JSON.stringify(parsedData, null, 2));
  } catch (e) {
    console.log('Final Parsed Data (non-serializable):', parsedData);
  }
  // Final validation to ensure we never return null/undefined values
  if (!parsedData.slideContent || typeof parsedData.slideContent !== 'object') {
    console.log('⚠️ Final validation: slideContent is invalid, setting to empty object');
    parsedData.slideContent = {};
  }
  
  if (!Array.isArray(parsedData.insights)) {
    console.log('⚠️ Final validation: insights is not array, setting to empty array');
    parsedData.insights = [];
  }
  
  if (!Array.isArray(parsedData.citations)) {
    console.log('⚠️ Final validation: citations is not array, setting to empty array');
    parsedData.citations = [];
  }
  
  if (!Array.isArray(parsedData.charts)) {
    console.log('⚠️ Final validation: charts is not array, setting to empty array');
    parsedData.charts = [];
  }

  console.log('Title:', parsedData.title);
  console.log('Has slideContent:', Object.keys(parsedData.slideContent).length > 0);
  console.log('Insights count:', parsedData.insights.length);
  console.log('Citations count:', parsedData.citations.length);
  console.log('Charts count:', parsedData.charts.length);
  console.log('HTML length:', parsedData.html?.length || 0);
  console.log('🔍 ========== PARSE SECTION RESPONSE END ==========');
  console.log('');
  
  return parsedData;
}

/**
 * Generate charts from slide content based on framework type
 */
function generateChartsFromSlideContent(slideContent, framework, sectionIndex) {
  if (!slideContent || typeof slideContent !== 'object') {
    console.log('⚠️ generateChartsFromSlideContent: Invalid slideContent:', slideContent);
    return [];
  }
  
  const charts = [];
  
  try {
    switch (framework) {
      case 'market_sizing':
        if (slideContent.market_segments && Array.isArray(slideContent.market_segments)) {
          // Create multiple charts for different product categories
          slideContent.market_segments.forEach((segment, segmentIndex) => {
            if (segment.products && Array.isArray(segment.products)) {
              segment.products.forEach((product, productIndex) => {
                const chartId = `chart_${sectionIndex + 1}_${segmentIndex}_${productIndex}`;
                const chartTitle = `${product.product_name || 'Product'} Volumes`;
                
                // Safely extract years and values - check both possible field names
                const marketSizeData = product.market_size_chf_bn || product.market_size_local_bn;
                if (marketSizeData && typeof marketSizeData === 'object') {
                  const years = Object.keys(marketSizeData).sort();
                  const values = years.map(year => {
                    const value = marketSizeData[year];
                    // Convert N/A to null for chart display
                    return (value === 'N/A' || value === 'n/a') ? null : value;
                  });
                  
                  // Only create chart if there are valid (non-N/A) values
                  const hasValidData = values.some(v => v !== null);
                  if (!hasValidData) return;
                
                  charts.push({
                    id: chartId,
                    title: chartTitle,
                    type: 'bar',
                    config: {
                      data: {
                        labels: years,
                        datasets: [{
                          label: product.product_name || 'Product',
                          data: values,
                          backgroundColor: `hsl(${(segmentIndex * 60 + productIndex * 30) % 360}, 70%, 50%)`,
                          borderColor: `hsl(${(segmentIndex * 60 + productIndex * 30) % 360}, 70%, 40%)`,
                          borderWidth: 1
                        }]
                      },
                      generated: true
                    }
                  });
                }
              });
            }
          });
        
        // Create a summary chart showing all products
        charts.push({
          id: `chart_${sectionIndex + 1}_summary`,
          title: 'Total Market Size by Product',
          type: 'bar',
          config: {
            data: convertMarketSizingToChartData(slideContent),
            generated: true
          }
        });
      }
      break;
      
    case 'competitive_landscape':
      const competitiveData = slideContent.competitive_landscape_table || slideContent.player_categories;
      if (competitiveData && Array.isArray(competitiveData)) {
        // Create a competitive landscape chart based on threat levels
        charts.push({
          id: `chart_${sectionIndex + 1}`,
          title: 'Competitive Threat Analysis',
          type: 'bar',
          config: {
            data: convertCompetitiveLandscapeToChartData(slideContent),
            generated: true
          }
        });
        
        // Create a market share chart if data is available
        const hasMarketShareData = competitiveData.some(cat => cat.market_share_estimate);
        if (hasMarketShareData) {
          charts.push({
            id: `chart_${sectionIndex + 1}_market_share`,
            title: 'Market Share by Category',
            type: 'pie',
            config: {
              data: convertCompetitiveLandscapeMarketShareToChartData(slideContent),
              generated: true
            }
          });
        }
      }
      break;
      
    case 'key_industry_trends':
      if (slideContent.market_trends_table && slideContent.market_trends_table.columns && Array.isArray(slideContent.market_trends_table.columns)) {
        // Create a trends overview chart
        charts.push({
          id: `chart_${sectionIndex + 1}`,
          title: 'Key Trends Overview',
          type: 'bar',
          config: {
            data: convertKeyIndustryTrendsToChartData(slideContent),
            generated: true
          }
        });
      }
      break;
      
    case 'capability_benchmark':
    case 'capabilities_assessment':
      if (slideContent.capability_dimensions) {
        // Create a capability gap chart
        charts.push({
          id: `chart_${sectionIndex + 1}`,
          title: 'Capability Gaps',
          type: 'bar',
          config: {
            data: convertCapabilityBenchmarkToChartData(slideContent),
            generated: true
          }
        });
      }
      break;
      
    case 'strategic_options':
    case 'cfa_demo_strategic':
      if (slideContent.ecosystem_components) {
        // Create ecosystem components chart
        charts.push({
          id: `chart_${sectionIndex + 1}_ecosystem`,
          title: 'Ecosystem Components',
          type: 'ecosystem',
          config: {
            data: convertEcosystemComponentsToChartData(slideContent),
            generated: true
          }
        });
      }
      
      if (slideContent.visual_structure) {
        // Create visual structure chart
        charts.push({
          id: `chart_${sectionIndex + 1}_structure`,
          title: 'Ecosystem Structure',
          type: 'circular',
          config: {
            data: convertVisualStructureToChartData(slideContent.visual_structure),
            generated: true
          }
        });
      }
      break;
      
    case 'deep_dive_strategic_option':
      if (slideContent.deep_dive_quadrant) {
        charts.push(...convertStrategicOptionDeepDiveToChartData(slideContent.deep_dive_quadrant));
      }
      break;

    case 'buy_vs_build':
      if (slideContent.build_vs_buy_matrix && slideContent.build_vs_buy_matrix.columns) {
        charts.push(...convertBuildVsBuyToChartData(slideContent.build_vs_buy_matrix.columns));
      }
      break;

    case 'product_roadmap':
      if (slideContent.product_roadmap_matrix && slideContent.product_roadmap_matrix.steps) {
        charts.push(...convertProductRoadmapToChartData(slideContent.product_roadmap_matrix.steps));
      }
      break;
      
      default:
        // Generic chart generation for other frameworks
        break;
    }
  } catch (error) {
    console.error('❌ Error generating charts from slide content:', error);
    console.error('Framework:', framework);
    console.error('SlideContent:', slideContent);
    // Return empty array on error to prevent crashes
    return [];
  }
  
  return charts;
}

/**
 * Convert ecosystem components to chart format
 */
function convertEcosystemComponentsToChartData(slideContent) {
  if (!slideContent.ecosystem_components) return null;
  
  const components = slideContent.ecosystem_components.map(component => ({
    name: component.component_name || component.name,
    description: component.description,
    addressesGap: component.addresses_gap,
    implementation: component.implementation,
    id: component.component_id || component.id
  }));
  
  return {
    labels: components.map(c => c.name),
    datasets: [{
      label: 'Ecosystem Components',
      data: components.map((_, index) => index + 1),
      backgroundColor: components.map((_, index) => 
        `hsl(${(index * 51) % 360}, 70%, 60%)`
      ),
      borderColor: components.map((_, index) => 
        `hsl(${(index * 51) % 360}, 70%, 40%)`
      ),
      borderWidth: 2
    }],
    componentDetails: components
  };
}

/**
 * Convert visual structure to chart format
 */
function convertVisualStructureToChartData(visualStructure) {
  if (!visualStructure) return null;
  
  return {
    center: visualStructure.center || 'Client',
    lifecycleStages: visualStructure.lifecycle_stages || [],
    format: visualStructure.format || 'Circular ecosystem diagram',
    partnershipsNote: visualStructure.partnerships_note
  };
}

/**
 * Convert market sizing data to chart format
 */
function convertMarketSizingToChartData(slideContent) {
  const labels = [];
  const datasets = [];
  
  if (slideContent.market_segments) {
    slideContent.market_segments.forEach(segment => {
      if (segment.products) {
        segment.products.forEach(product => {
          labels.push(product.product_name);
          
          if (product.market_size_chf_bn) {
            const years = Object.keys(product.market_size_chf_bn).sort();
            const data = years.map(year => product.market_size_chf_bn[year]);
            
            datasets.push({
              label: product.product_name,
              data: data,
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`
            });
          }
        });
      }
    });
  }
  
  return {
    labels: labels,
    datasets: datasets
  };
}

/**
 * Convert competitive landscape data to chart format
 */
function convertCompetitiveLandscapeToChartData(slideContent) {
  const labels = [];
  const datasets = [];
  
  // Handle both player_categories and competitive_landscape_table structures
  const competitiveData = slideContent.player_categories || slideContent.competitive_landscape_table;
  if (competitiveData && Array.isArray(competitiveData)) {
    competitiveData.forEach(category => {
      const categoryName = category.category_name || category.competition_category || 'Unknown Category';
      labels.push(categoryName);
      
      // Convert threat level to numeric value
      const threatValue = category.threat_level === 'HIGH' ? 4 : 
                        category.threat_level === 'MEDIUM-HIGH' ? 3 :
                        category.threat_level === 'MEDIUM' ? 2 : 1;
      
      // Color based on threat level
      const threatColor = category.threat_level === 'HIGH' ? '#ef4444' : 
                        category.threat_level === 'MEDIUM-HIGH' ? '#f97316' :
                        category.threat_level === 'MEDIUM' ? '#eab308' : '#22c55e';
      
      datasets.push({
        label: categoryName,
        data: [threatValue],
        backgroundColor: threatColor,
        borderColor: threatColor,
        borderWidth: 1
      });
    });
  }
  
  return {
    labels: labels,
    datasets: datasets
  };
}

/**
 * Convert competitive landscape market share data to chart format
 */
function convertCompetitiveLandscapeMarketShareToChartData(slideContent) {
  const labels = [];
  const data = [];
  const backgroundColor = [];
  
  // Handle both player_categories and competitive_landscape_table structures
  const competitiveData = slideContent.competitive_landscape_table || slideContent.player_categories;
  if (competitiveData && Array.isArray(competitiveData)) {
    competitiveData.forEach((category, index) => {
      if (category.market_share_estimate) {
        const categoryName = category.competition_category || category.category_name || 'Unknown Category';
        labels.push(categoryName);
        data.push(category.market_share_estimate);
        backgroundColor.push(`hsl(${(index * 60) % 360}, 70%, 50%)`);
      }
    });
  }
  
  return {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: backgroundColor,
      borderWidth: 1
    }]
  };
}

/**
 * Convert capability benchmark data to chart format
 */
function convertCapabilityBenchmarkToChartData(slideContent) {
  const labels = [];
  const datasets = [];
  
  if (slideContent.capability_dimensions) {
    slideContent.capability_dimensions.forEach(dimension => {
      labels.push(dimension.dimension_name);
      
      // Convert gap assessment to numeric value
      const gapValue = dimension.gap_assessment === 'RED' ? 1 : 
                      dimension.gap_assessment === 'AMBER' ? 2 : 3;
      
      datasets.push({
        label: dimension.dimension_name,
        data: [gapValue],
        backgroundColor: dimension.gap_assessment === 'RED' ? '#ef4444' :
                        dimension.gap_assessment === 'AMBER' ? '#f59e0b' : '#10b981'
      });
    });
  }
  
  return {
    labels: labels,
    datasets: datasets
  };
}

/**
 * Convert strategic option deep dive data to chart format
 */
function convertStrategicOptionDeepDiveToChartData(deepDiveQuadrant) {
  const charts = [];
  
  if (!deepDiveQuadrant) return charts;
  
  // Create a quadrant analysis chart
  const labels = ['Pros', 'Cons', 'Enablers', 'Risks'];
  const data = [
    deepDiveQuadrant.pros ? deepDiveQuadrant.pros.length : 0,
    deepDiveQuadrant.cons ? deepDiveQuadrant.cons.length : 0,
    deepDiveQuadrant.enablers ? deepDiveQuadrant.enablers.length : 0,
    deepDiveQuadrant.risks ? deepDiveQuadrant.risks.length : 0
  ];
  
  charts.push({
    id: 'quadrant_analysis',
    title: 'Strategic Option Analysis',
    type: 'bar',
    config: {
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Factors',
          data: data,
          backgroundColor: ['#22c55e', '#ef4444', '#3b82f6', '#eab308'],
          borderColor: ['#16a34a', '#dc2626', '#2563eb', '#ca8a04'],
          borderWidth: 1
        }]
      },
      generated: true
    }
  });
  
  return charts;
}

/**
 * Convert build vs buy data to chart format
 */
function convertBuildVsBuyToChartData(columns) {
  const charts = [];
  
  if (!columns || !Array.isArray(columns)) return charts;
  
  // Create a comparison radar chart
  const approaches = columns.map(col => col.approach || 'Unknown');
  const controlData = columns.map(col => {
    const control = col.strategic_control;
    return control === 'High' ? 3 : control === 'Medium' ? 2 : 1;
  });
  const speedData = columns.map(col => {
    const speed = col.speed_to_market;
    return speed === 'High' ? 3 : speed === 'Medium' ? 2 : 1;
  });
  const investmentData = columns.map(col => {
    const investment = col.investment_required;
    return investment === 'High' ? 3 : investment === 'Medium' ? 2 : 1;
  });
  const riskData = columns.map(col => {
    const risk = col.risk_level;
    return risk === 'High' ? 3 : risk === 'Medium' ? 2 : 1;
  });
  const fitData = columns.map(col => {
    const fit = col.organizational_fit;
    return fit === 'High' ? 3 : fit === 'Medium' ? 2 : 1;
  });
  
  charts.push({
    id: 'build_vs_buy_comparison',
    title: 'Build vs Buy Comparison',
    type: 'radar',
    config: {
      data: {
        labels: ['Strategic Control', 'Speed to Market', 'Investment Required', 'Risk Level', 'Organizational Fit'],
        datasets: approaches.map((approach, index) => ({
          label: approach,
          data: [controlData[index], speedData[index], investmentData[index], riskData[index], fitData[index]],
          backgroundColor: `hsla(${index * 120}, 70%, 50%, 0.2)`,
          borderColor: `hsl(${index * 120}, 70%, 50%)`,
          borderWidth: 2
        }))
      },
      generated: true
    }
  });
  
  return charts;
}

/**
 * Convert product roadmap data to chart format
 */
function convertProductRoadmapToChartData(steps) {
  const charts = [];
  
  if (!steps || !Array.isArray(steps)) return charts;
  
  // Create a timeline chart
  const labels = steps.map((step, index) => `Step ${index + 1}`);
  const substepCounts = steps.map(step => step.substeps ? step.substeps.length : 0);
  
  charts.push({
    id: 'roadmap_timeline',
    title: 'Implementation Timeline',
    type: 'bar',
    config: {
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Sub-steps',
          data: substepCounts,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1
        }]
      },
      generated: true
    }
  });
  
  return charts;
}
