/**
 * Dynamic Framework Renderer
 * Converts JSON responses from CFA-DEMO agents into HTML based on framework type
 */

// Framework-specific render configurations based on CFA-DEMO markdown files
const FRAMEWORK_RENDERERS = {
  market_sizing: {
    title: 'Market Sizing Analysis',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
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
              
              if (product.market_size_chf_bn) {
                html += '<div class="market-size mb-2">';
                html += '<p class="text-xs text-gray-600 mb-1">Market Size (CHF Bn)</p>';
                Object.entries(product.market_size_chf_bn).forEach(([year, value]) => {
                  html += `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">${year}: ${value}</span>`;
                });
                html += '</div>';
              }
              
              if (product.cagr_2019_2030) {
                html += `<p class="text-xs text-green-600 font-medium">CAGR: ${product.cagr_2019_2030}</p>`;
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
          html += `<span class="bg-green-100 text-green-800 text-sm px-3 py-1 rounded font-medium">${year}: CHF ${value} Bn</span>`;
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
      
      let html = '<div class="competitive-landscape-content">';
      
      if (slideContent.player_categories) {
        html += '<div class="player-categories">';
        html += '<h3 class="text-lg font-semibold mb-4">Competitive Player Categories</h3>';
        
        slideContent.player_categories.forEach(category => {
          html += `<div class="category mb-6 p-4 bg-gray-50 rounded-lg">`;
          html += `<h4 class="font-medium text-gray-800 mb-2">${category.category_name}</h4>`;
          
          if (category.business_model_today) {
            html += `<p class="text-sm text-gray-700 mb-2"><strong>Current Model:</strong> ${category.business_model_today}</p>`;
          }
          
          if (category.future_outlook) {
            html += `<p class="text-sm text-gray-700 mb-2"><strong>Future Outlook:</strong> ${category.future_outlook}</p>`;
          }
          
          if (category.key_players && category.key_players.length > 0) {
            html += '<div class="key-players mb-2">';
            html += '<p class="text-sm text-gray-600 mb-1">Key Players:</p>';
            html += '<div class="flex flex-wrap gap-1">';
            category.key_players.forEach(player => {
              html += `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${player}</span>`;
            });
            html += '</div></div>';
          }
          
          if (category.player_type) {
            html += `<p class="text-xs text-gray-500"><strong>Type:</strong> ${category.player_type}</p>`;
          }
          
          if (category.threat_level) {
            const threatColor = category.threat_level === 'HIGH' ? 'red' : 
                              category.threat_level === 'MEDIUM-HIGH' ? 'orange' : 
                              category.threat_level === 'MEDIUM' ? 'yellow' : 'green';
            html += `<p class="text-xs text-${threatColor}-600 font-medium"><strong>Threat Level:</strong> ${category.threat_level}</p>`;
          }
          
          html += '</div>';
        });
        
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }
  },

  capability_benchmark: {
    title: 'Capability Benchmark Analysis',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      let html = '<div class="capability-benchmark-content">';
      
      if (slideContent.capability_dimensions) {
        html += '<div class="capability-dimensions">';
        html += '<h3 class="text-lg font-semibold mb-4">Capability Assessment</h3>';
        
        slideContent.capability_dimensions.forEach(dimension => {
          const gapColor = dimension.gap_assessment === 'RED' ? 'red' : 
                          dimension.gap_assessment === 'AMBER' ? 'yellow' : 'green';
          
          html += `<div class="dimension mb-6 p-4 bg-gray-50 rounded-lg">`;
          html += `<h4 class="font-medium text-gray-800 mb-2">${dimension.dimension_name}</h4>`;
          
          // Gap assessment badge
          html += `<div class="mb-3">`;
          html += `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${gapColor}-100 text-${gapColor}-800">`;
          html += `${dimension.gap_assessment} GAP`;
          html += `</span></div>`;
          
          // Client current situation
          if (dimension.client_current_situation && dimension.client_current_situation.length > 0) {
            html += '<div class="client-situation mb-3">';
            html += '<p class="text-sm font-medium text-gray-700 mb-1">Current Situation:</p>';
            html += '<ul class="text-sm text-gray-600">';
            dimension.client_current_situation.forEach(situation => {
              html += `<li class="ml-2 mb-1">• ${situation}</li>`;
            });
            html += '</ul></div>';
          }
          
          // Best practice competitor
          if (dimension.best_practice_competitor) {
            html += '<div class="best-practice mb-3">';
            html += `<p class="text-sm font-medium text-gray-700 mb-1">Best Practice: <span class="text-blue-600">${dimension.best_practice_competitor}</span></p>`;
            
            if (dimension.best_practice_description && dimension.best_practice_description.length > 0) {
              html += '<ul class="text-sm text-gray-600">';
              dimension.best_practice_description.forEach(description => {
                html += `<li class="ml-2 mb-1">• ${description}</li>`;
              });
              html += '</ul>';
            }
            html += '</div>';
          }
          
          html += '</div>';
        });
        
        html += '</div>';
      }
      
      // Gap summary
      if (slideContent.gap_summary) {
        html += '<div class="gap-summary mt-6 p-4 bg-blue-50 rounded-lg">';
        html += '<h4 class="font-medium text-blue-800 mb-2">Gap Summary</h4>';
        html += '<div class="flex flex-wrap gap-4 text-sm">';
        html += `<span class="text-red-600">Red Gaps: ${slideContent.gap_summary.red_gaps || 0}</span>`;
        html += `<span class="text-yellow-600">Amber Gaps: ${slideContent.gap_summary.amber_gaps || 0}</span>`;
        html += `<span class="text-green-600">Green Gaps: ${slideContent.gap_summary.green_gaps || 0}</span>`;
        html += '</div>';
        
        if (slideContent.gap_summary.priority_areas && slideContent.gap_summary.priority_areas.length > 0) {
          html += '<div class="mt-2">';
          html += '<p class="text-sm font-medium text-blue-700 mb-1">Priority Areas:</p>';
          html += '<div class="flex flex-wrap gap-1">';
          slideContent.gap_summary.priority_areas.forEach(area => {
            html += `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${area}</span>`;
          });
          html += '</div></div>';
        }
        
        html += '</div>';
      }
      
      html += '</div>';
      return html;
    }
  },

  strategic_options: {
    title: 'Strategic Options Analysis',
    renderSlideContent: (slideContent) => {
      if (!slideContent) return '';
      
      let html = '<div class="strategic-options-content">';
      
      // Strategic option
      if (slideContent.strategic_option) {
        html += '<div class="strategic-option mb-6 p-4 bg-blue-50 rounded-lg">';
        html += `<h3 class="text-lg font-semibold text-blue-800 mb-2">${slideContent.strategic_option.option_name}</h3>`;
        html += `<p class="text-sm text-blue-700 mb-2"><strong>Type:</strong> ${slideContent.strategic_option.option_type}</p>`;
        
        if (slideContent.strategic_option.strategic_rationale) {
          html += `<p class="text-sm text-gray-700 mb-3">${slideContent.strategic_option.strategic_rationale}</p>`;
        }
        
        if (slideContent.strategic_option.key_objectives && slideContent.strategic_option.key_objectives.length > 0) {
          html += '<div class="key-objectives">';
          html += '<p class="text-sm font-medium text-blue-700 mb-1">Key Objectives:</p>';
          html += '<ul class="text-sm text-gray-700">';
          slideContent.strategic_option.key_objectives.forEach(objective => {
            html += `<li class="ml-2 mb-1">• ${objective}</li>`;
          });
          html += '</ul></div>';
        }
        
        html += '</div>';
      }
      
      // Ecosystem components
      if (slideContent.ecosystem_components) {
        html += '<div class="ecosystem-components">';
        html += '<h3 class="text-lg font-semibold mb-4">Ecosystem Components</h3>';
        
        slideContent.ecosystem_components.forEach(component => {
          html += `<div class="component mb-4 p-4 bg-gray-50 rounded-lg">`;
          html += `<h4 class="font-medium text-gray-800 mb-2">${component.component_name}</h4>`;
          
          if (component.description) {
            html += `<p class="text-sm text-gray-700 mb-2">${component.description}</p>`;
          }
          
          if (component.addresses_gap) {
            html += `<p class="text-xs text-blue-600 mb-1"><strong>Addresses:</strong> ${component.addresses_gap}</p>`;
          }
          
          if (component.implementation) {
            html += `<p class="text-xs text-gray-600"><strong>Implementation:</strong> ${component.implementation}</p>`;
          }
          
          html += '</div>';
        });
        
        html += '</div>';
      }
      
      // Visual structure
      if (slideContent.visual_structure) {
        html += '<div class="visual-structure mt-6 p-4 bg-green-50 rounded-lg">';
        html += '<h4 class="font-medium text-green-800 mb-2">Ecosystem Structure</h4>';
        html += `<p class="text-sm text-green-700 mb-2"><strong>Format:</strong> ${slideContent.visual_structure.format}</p>`;
        html += `<p class="text-sm text-green-700 mb-2"><strong>Center:</strong> ${slideContent.visual_structure.center}</p>`;
        
        if (slideContent.visual_structure.lifecycle_stages && slideContent.visual_structure.lifecycle_stages.length > 0) {
          html += '<div class="lifecycle-stages">';
          html += '<p class="text-sm font-medium text-green-700 mb-1">Lifecycle Stages:</p>';
          html += '<div class="flex flex-wrap gap-1">';
          slideContent.visual_structure.lifecycle_stages.forEach(stage => {
            html += `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${stage}</span>`;
          });
          html += '</div></div>';
        }
        
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
  const renderer = FRAMEWORK_RENDERERS[framework];
  
  if (!renderer) {
    // Fallback for unknown frameworks
    return {
      title: framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      html: slideContent ? `<pre class="text-xs text-gray-600 whitespace-pre-wrap">${JSON.stringify(slideContent, null, 2)}</pre>` : '',
      insights,
      citations
    };
  }
  
  return {
    title: renderer.title,
    html: renderer.renderSlideContent(slideContent),
    insights,
    citations
  };
}

/**
 * Parse section response dynamically based on framework type
 */
export function parseSectionResponse(agentResult, framework, sectionIndex = 0) {
  console.log(`🔧 Parsing response for framework: ${framework}`);
  console.log(`📋 Agent result:`, agentResult);
  
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
    try {
      const responseData = JSON.parse(agentResult.response);
      console.log(`✅ Parsed JSON response for ${framework}:`, responseData);
      
      // Extract slide content
      if (responseData.slide_content) {
        parsedData.slideContent = responseData.slide_content;
      }
      
      // Extract insights
      if (responseData.insights && Array.isArray(responseData.insights)) {
        parsedData.insights = responseData.insights;
      }
      
      // Extract citations
      if (responseData.citations && Array.isArray(responseData.citations)) {
        parsedData.citations = responseData.citations;
      }
      
      // Extract title from slide content
      if (responseData.slide_content && responseData.slide_content.title) {
        parsedData.title = responseData.slide_content.title;
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
      parsedData.charts = generateChartsFromSlideContent(responseData.slide_content, framework, sectionIndex);
      
    } catch (e) {
      console.log(`❌ Could not parse JSON response for ${framework}:`, e.message);
      
      // Fallback: treat as plain text
      parsedData.title = framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      parsedData.description = agentResult.response;
    }
  } else {
    // Fallback for non-JSON responses
    parsedData.title = framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    parsedData.description = agentResult.response || agentResult.content || '';
  }
  
  // Generate HTML using framework renderer
  const rendered = renderFrameworkContent(parsedData.framework, parsedData.slideContent, parsedData.insights, parsedData.citations);
  parsedData.title = rendered.title;
  parsedData.html = rendered.html;
  
  console.log(`✅ Final parsed data for ${framework}:`, parsedData);
  return parsedData;
}

/**
 * Generate charts from slide content based on framework type
 */
function generateChartsFromSlideContent(slideContent, framework, sectionIndex) {
  if (!slideContent) return [];
  
  const charts = [];
  
  switch (framework) {
    case 'market_sizing':
      if (slideContent.market_segments) {
        // Create multiple charts for different product categories
        slideContent.market_segments.forEach((segment, segmentIndex) => {
          segment.products.forEach((product, productIndex) => {
            const chartId = `chart_${sectionIndex + 1}_${segmentIndex}_${productIndex}`;
            const chartTitle = `${product.product_name} Volumes`;
            
            // Extract years and values
            const years = Object.keys(product.market_size_chf_bn).sort();
            const values = years.map(year => product.market_size_chf_bn[year]);
            
            charts.push({
              id: chartId,
              title: chartTitle,
              type: 'bar',
              config: {
                data: {
                  labels: years,
                  datasets: [{
                    label: product.product_name,
                    data: values,
                    backgroundColor: `hsl(${(segmentIndex * 60 + productIndex * 30) % 360}, 70%, 50%)`,
                    borderColor: `hsl(${(segmentIndex * 60 + productIndex * 30) % 360}, 70%, 40%)`,
                    borderWidth: 1
                  }]
                },
                generated: true
              }
            });
          });
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
      if (slideContent.player_categories) {
        // Create a competitive landscape chart
        charts.push({
          id: `chart_${sectionIndex + 1}`,
          title: 'Competitive Landscape',
          type: 'radar',
          config: {
            data: convertCompetitiveLandscapeToChartData(slideContent),
            generated: true
          }
        });
      }
      break;
      
    case 'capability_benchmark':
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
      
    default:
      // Generic chart generation for other frameworks
      break;
  }
  
  return charts;
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
  
  if (slideContent.player_categories) {
    slideContent.player_categories.forEach(category => {
      labels.push(category.category_name);
      
      // Convert threat level to numeric value
      const threatValue = category.threat_level === 'HIGH' ? 4 : 
                        category.threat_level === 'MEDIUM-HIGH' ? 3 :
                        category.threat_level === 'MEDIUM' ? 2 : 1;
      
      datasets.push({
        label: category.category_name,
        data: [threatValue],
        backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`
      });
    });
  }
  
  return {
    labels: labels,
    datasets: datasets
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
