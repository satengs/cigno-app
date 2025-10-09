import { NextResponse } from 'next/server';
import connectDB from '../../lib/db/mongoose';
import Project from '../../lib/models/Project';
import User from '../../lib/models/User';
import Client from '../../lib/models/Client';
import Contact from '../../lib/models/Contact';
import Organisation from '../../lib/models/Organisation';
import Deliverable from '../../lib/models/Deliverable';
import MenuItemModel from '../../lib/models/MenuItemModel';
import { formatForAPI, isValidObjectId } from '../../lib/utils/idUtils';

export async function GET() {
  try {
    await connectDB();
    console.log('Database connected, fetching projects...');
    
    const projects = await Project.findActive()
      .populate('client_owner', 'name industry')
      .populate('internal_owner', 'first_name last_name email_address')
      .populate('organisation', 'name industry')
      .populate('staffing.user', 'first_name last_name email_address')
      .populate('deliverables', 'name status due_date')
      .lean();
    
    console.log(`Found ${projects.length} projects`);
    
    return NextResponse.json({ 
      success: true,
      projects: formatForAPI(projects)
    });
    
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch projects',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const projectData = await request.json();

    console.log('Creating new project:', {
      name: projectData.name,
      client_owner: projectData.client_owner
    });
    
    // Helper function to find user by name/identifier
    const findUser = async (identifier) => {
      if (!identifier) return null;
      
      // If it's already an ObjectId, return it
      if (typeof identifier === 'object' && identifier._id) {
        return identifier._id;
      }
      
      if (typeof identifier === 'string' && identifier.match(/^[0-9a-fA-F]{24}$/)) {
        return identifier;
      }
      
      // Try to find user by name (first_name + last_name) or email
      const user = await User.findOne({
        $or: [
          { $expr: { $eq: [{ $concat: ['$first_name', ' ', '$last_name'] }, identifier] } },
          { email_address: identifier },
          { first_name: identifier }
        ]
      }).select('_id');
      
      return user ? user._id : null;
    };

    // Helper function to find client by name/identifier
    const findClient = async (identifier) => {
      if (!identifier) return null;

      // If it's already an ObjectId, return the referenced document id
      if (typeof identifier === 'object' && identifier._id) {
        return identifier._id;
      }

      if (typeof identifier === 'string' && identifier.match(/^[0-9a-fA-F]{24}$/)) {
        return identifier;
      }

      // Try to find client by name
      const client = await Client.findOne({ name: identifier }).select('_id');
      if (client) {
        return client._id;
      }

      return null;
    };

    // Resolve user and client references
    const primaryClientIdentifier = projectData.client || projectData.client_owner;
    let clientId = await findClient(primaryClientIdentifier);
    
    // Validate that client exists
    if (!clientId && primaryClientIdentifier) {
      return NextResponse.json({ 
        error: 'Client not found',
        details: `No client found with identifier: ${primaryClientIdentifier}. Please create the client first or use a valid client ID.` 
      }, { status: 400 });
    }
    
    const internalOwnerId = await findUser(projectData.internal_owner);
    const createdById = await findUser(projectData.created_by);
    const updatedById = await findUser(projectData.updated_by);

    // Gather organisation context
    const clientDocument = clientId ? await Client.findById(clientId).select('organisation') : null;
    const defaultUserCandidate = internalOwnerId || createdById;
    const userDocument = defaultUserCandidate ? await User.findById(defaultUserCandidate).select('organisation') : null;
    const organisationId = projectData.organisation || clientDocument?.organisation || userDocument?.organisation;

    // Validate required fields
    if (!projectData.name) {
      return NextResponse.json({ 
        error: 'Project name is required',
        details: 'Please provide a project name' 
      }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ 
        error: 'Client is required',
        details: 'Please provide a valid client ID or create a client first' 
      }, { status: 400 });
    }

    if (!internalOwnerId && !createdById) {
      return NextResponse.json({ 
        error: 'User is required',
        details: 'Please provide a valid internal_owner or created_by user ID' 
      }, { status: 400 });
    }

    if (!organisationId) {
      return NextResponse.json({ 
        error: 'Organisation is required',
        details: 'Unable to determine organisation from client or user context. Please provide a valid organisation ID.' 
      }, { status: 400 });
    }

    // Validate dates
    if (!projectData.start_date || !projectData.end_date) {
      return NextResponse.json({ 
        error: 'Start and end dates are required',
        details: 'Please provide valid start_date and end_date' 
      }, { status: 400 });
    }

    const defaultUser = internalOwnerId || createdById;

    // Create the new project (all required fields validated above)
    // Ensure proper budget structure
    const budgetData = projectData.budget || {};
    const budgetAmount = budgetData.amount || projectData.budget_amount || 0;
    const budgetCurrency = budgetData.currency || projectData.currency || projectData.budget_currency || 'USD';
    const budgetType = budgetData.type || projectData.budget_type || 'Fixed';
    
    const newProject = new Project({
      name: projectData.name,
      description: projectData.description,
      start_date: new Date(projectData.start_date),
      end_date: new Date(projectData.end_date),
      status: projectData.status,
      client: clientId,
      client_owner: (typeof projectData.client_owner === 'string' && projectData.client_owner.match(/^[0-9a-fA-F]{24}$/))
        ? projectData.client_owner
        : clientId,
      internal_owner: defaultUser,
      organisation: organisationId,
      reference_documents: projectData.reference_documents || [],
      budget: { 
        amount: budgetAmount, 
        currency: budgetCurrency, 
        type: budgetType,
        allocated: budgetData.allocated || 0, 
        spent: budgetData.spent || 0 
      },
      team_members: projectData.team_members || [],
      staffing: projectData.staffing || [],
      tags: projectData.tags || [],
      priority: projectData.priority,
      project_type: projectData.project_type,
      communication_preferences: projectData.communication_preferences || {},
      notes: projectData.notes || '',
      created_by: defaultUser,
      updated_by: defaultUser
    });
    
    const savedProject = await newProject.save();
    console.log('Project created successfully with ID:', savedProject._id.toString());
    
    // Create deliverables - either from provided data or AI analysis
    const createdDeliverables = [];
    let deliverablesArray = projectData.deliverables;
    
    // If no deliverables provided, try to generate them from project description using AI
    // Only if explicitly enabled via environment variable or project data flag
    const enableAIDeliverableGeneration = process.env.ENABLE_AI_DELIVERABLE_GENERATION === 'true' || projectData.enableAIDeliverableGeneration === true;
    
    if (enableAIDeliverableGeneration && (!deliverablesArray || !Array.isArray(deliverablesArray) || deliverablesArray.length === 0)) {
      if (projectData.description) {
        console.log('No deliverables provided, analyzing project description with AI...');
        try {
          const aiAnalysisResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/projects/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              description: projectData.description,
              projectData: projectData
            })
          });
          
          if (aiAnalysisResponse.ok) {
            const aiResult = await aiAnalysisResponse.json();
            if (aiResult.success && aiResult.analyzedProject && aiResult.analyzedProject.deliverables) {
              deliverablesArray = aiResult.analyzedProject.deliverables;
              console.log(`AI generated ${deliverablesArray.length} deliverables from project description`);
              
              // Important: Preserve user's original dates if they provided them
              // AI analysis should not override user-provided start_date and end_date
              console.log('Preserving user-provided dates over AI analysis results');
            }
          } else {
            console.log('AI analysis failed, proceeding without auto-generated deliverables');
          }
        } catch (aiError) {
          console.log('AI analysis error:', aiError.message, '- proceeding without auto-generated deliverables');
        }
      }
    } else if (!enableAIDeliverableGeneration) {
      console.log('AI deliverable generation is disabled, proceeding without auto-generated deliverables');
    }
    
    if (deliverablesArray && Array.isArray(deliverablesArray) && deliverablesArray.length > 0) {
      console.log(`Creating ${deliverablesArray.length} deliverables for project...`);
      
      for (const deliverableData of deliverablesArray) {
        try {
          // Map status values to valid enum values
          const mapStatus = (status) => {
            if (!status) return 'draft';
            const statusMap = {
              'Planned': 'draft',
              'In Progress': 'in_progress',
              'Completed': 'completed',
              'Draft': 'draft',
              'Review': 'in_review',
              'Approved': 'approved',
              'Delivered': 'delivered',
              'Rejected': 'rejected'
            };
            return statusMap[status] || status.toLowerCase().replace(' ', '_');
          };
          
          // Map type values to valid enum values
          const mapType = (type) => {
            if (!type) return 'Recommendation';

            const normalized = type.toString().trim();
            if (!normalized) return 'Recommendation';

            const lower = normalized.toLowerCase();

            const typeMap = {
              recommendation: 'Recommendation',
              'workshop document': 'Workshop Document',
              workshop: 'Workshop Document',
              document: 'Documentation',
              documentation: 'Documentation',
              manual: 'Documentation',
              api: 'API',
              integration: 'API',
              dashboard: 'Dashboard',
              dataviz: 'Dashboard',
              presentation: 'Presentation',
              deck: 'Presentation',
              slides: 'Presentation',
              report: 'Report',
              strategy: 'Strategy',
              roadmap: 'Strategy',
              plan: 'Strategy',
              analysis: 'Analysis',
              assessment: 'Analysis',
              design: 'Design',
              prototype: 'Design',
              code: 'Code'
            };

            if (typeMap[lower]) {
              return typeMap[lower];
            }

            if (lower.includes('dashboard')) return 'Dashboard';
            if (lower.includes('api')) return 'API';
            if (lower.includes('deck') || lower.includes('presentation')) return 'Presentation';
            if (lower.includes('roadmap') || lower.includes('plan')) return 'Strategy';
            if (lower.includes('report')) return 'Report';
            if (lower.includes('analysis') || lower.includes('assessment')) return 'Analysis';
            if (lower.includes('brief')) return 'Brief';
            if (lower.includes('storyline')) return 'Storyline';
            if (lower.includes('design')) return 'Design';
            if (lower.includes('doc')) return 'Documentation';
            
            // Handle invalid types like "deliverable" by defaulting to "Other"
            if (lower === 'deliverable' || lower === 'item' || lower === 'task') {
              return 'Other';
            }

            // For any other unrecognized type, default to "Other" instead of capitalizing
            return 'Other';
          };
          
          // Map format values to valid enum values
          const mapFormat = (format) => {
            if (!format) return 'PDF';
            const formatMap = {
              'json': 'OTHER',
              'pdf': 'PDF',
              'docx': 'DOCX',
              'pptx': 'PPTX',
              'xlsx': 'XLSX',
              'html': 'HTML',
              'txt': 'TXT',
              'web': 'HTML',
              'api': 'OTHER'
            };
            return formatMap[format.toLowerCase()] || 'PDF';
          };

          const deliverable = new Deliverable({
            name: deliverableData.title || deliverableData.name || 'Untitled Deliverable',
            type: mapType(deliverableData.type),
            status: mapStatus(deliverableData.status),
            priority: deliverableData.priority || 'medium',
            brief: deliverableData.description || deliverableData.title || 'Deliverable brief',
            project: savedProject._id,
            due_date: deliverableData.due_date ? new Date(deliverableData.due_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            estimated_hours: deliverableData.estimated_hours || 0,
            notes: deliverableData.notes || '',
            created_by: defaultUser,
            updated_by: defaultUser,
            // Additional fields from your example
            format: mapFormat(deliverableData.metadata?.format || 'pdf'),
            quality_score: deliverableData.quality_score || 0,
            dependencies: deliverableData.dependencies || [],
            metadata: deliverableData.metadata || {}
          });
          
          const savedDeliverable = await deliverable.save();
          createdDeliverables.push(savedDeliverable);
          console.log(`✅ Created deliverable: ${savedDeliverable.name} (${savedDeliverable._id})`);
          
        } catch (deliverableError) {
          console.error(`❌ Failed to create deliverable "${deliverableData.title || deliverableData.name}":`, deliverableError.message);
          // Continue creating other deliverables even if one fails
        }
      }
      
      if (createdDeliverables.length > 0) {
        console.log(`✅ Successfully created ${createdDeliverables.length} out of ${deliverablesArray.length} deliverables`);
      }
    }
    
    // Create corresponding menu item
    try {
      console.log('Creating menu item for project...');
      
      // Find the client's menu item to use as parent
      let parentMenuItemId = null;
      if (clientId) {
        const clientMenuItem = await MenuItemModel.findOne({
          type: 'client',
          'metadata.business_entity_id': clientId.toString()
        });
        if (clientMenuItem) {
          parentMenuItemId = clientMenuItem._id;
          console.log('Found client menu item as parent:', parentMenuItemId);
        } else {
          console.log('No client menu item found for client:', clientId);
        }
      }
      
      // Map project status to valid menu status
      let menuStatus = 'active';
      switch (savedProject.status) {
        case 'Planning':
          menuStatus = 'not-started';
          break;
        case 'Active':
        case 'In Progress':
          menuStatus = 'in-progress';
          break;
        case 'Completed':
          menuStatus = 'completed';
          break;
        case 'Cancelled':
          menuStatus = 'cancelled';
          break;
        case 'On Hold':
          menuStatus = 'on-hold';
          break;
        default:
          menuStatus = 'active';
      }
      
      const menuItemData = {
        title: savedProject.name,
        description: savedProject.description,
        type: 'project',
        status: menuStatus,
        parentId: parentMenuItemId,
        order: 0,
        isCollapsible: true,
        metadata: {
          project_id: savedProject._id.toString(),
          business_entity_id: savedProject._id.toString(),
          budget_amount: savedProject.budget?.amount || 0,
          start_date: savedProject.start_date,
          end_date: savedProject.end_date,
          client_owner: (typeof projectData.client_owner === 'string' && projectData.client_owner.trim())
            ? projectData.client_owner.trim()
            : clientId?.toString(),
          internal_owner: savedProject.internal_owner?.toString()
        }
      };
      
      const menuItem = new MenuItemModel(menuItemData);
      const savedMenuItem = await menuItem.save();
      
      // If parentMenuItemId exists, update parent's children array
      if (parentMenuItemId) {
        await MenuItemModel.findByIdAndUpdate(
          parentMenuItemId,
          { $push: { children: savedMenuItem._id } }
        );
        console.log('Updated parent menu item children array');
      }
      
      console.log('Menu item created successfully:', savedMenuItem._id);
      
      // Create menu items for deliverables if any were created
      if (createdDeliverables.length > 0) {
        console.log(`Creating ${createdDeliverables.length} deliverable menu items...`);
        
        for (const deliverable of createdDeliverables) {
          try {
            // Map deliverable status to menu item status
            const mapDeliverableStatusToMenuStatus = (status) => {
              const statusMap = {
                'draft': 'draft',
                'in_review': 'in_review',
                'approved': 'approved',
                'in_progress': 'in-progress', // Note: menu uses hyphen, deliverable uses underscore
                'completed': 'completed',
                'delivered': 'delivered',
                'rejected': 'rejected'
              };
              return statusMap[status] || 'active';
            };

            const deliverableMenuItem = new MenuItemModel({
              title: deliverable.name,
              description: deliverable.brief || '',
              type: 'deliverable',
              status: mapDeliverableStatusToMenuStatus(deliverable.status),
              parentId: savedMenuItem._id, // Use project menu item as parent
              order: 0,
              isCollapsible: true,
              metadata: {
                deliverableId: deliverable._id.toString(),
                type: deliverable.type,
                due_date: deliverable.due_date,
                priority: deliverable.priority
              },
              brief: deliverable.brief || '',
              dueDate: deliverable.due_date,
              priority: deliverable.priority || 'medium'
            });
            
            const savedDeliverableMenuItem = await deliverableMenuItem.save();
            
            // Update project menu item's children array
            const updateResult = await MenuItemModel.findByIdAndUpdate(
              savedMenuItem._id,
              { $push: { children: savedDeliverableMenuItem._id } }
            );
            console.log(`✅ Created deliverable menu item: ${deliverable.name} (${savedDeliverableMenuItem._id})`);
            
          } catch (deliverableMenuError) {
            console.error(`❌ Failed to create menu item for deliverable "${deliverable.name}":`, deliverableMenuError.message);
            // Continue creating other deliverable menu items even if one fails
          }
        }
      }
      
    } catch (menuError) {
      console.error('Failed to create menu item for project:', menuError);
      // Don't fail the entire request if menu creation fails
    }
    
    return NextResponse.json({ 
      success: true, 
      id: savedProject._id,
      message: `Project created successfully${(createdDeliverables && createdDeliverables.length > 0) ? ` with ${createdDeliverables.length} deliverables` : ''}`,
      project: formatForAPI({
        ...savedProject.toObject(),
        deliverables: createdDeliverables || []
      }),
      deliverables: formatForAPI(createdDeliverables || [])
    });
    
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ 
      error: 'Failed to create project',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const updateData = await request.json();
    const { id, ...projectData } = updateData;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Project ID is required',
        details: 'Please provide a project ID to update' 
      }, { status: 400 });
    }
    
    console.log('Updating project:', id, {
      name: projectData.name,
      client_owner: projectData.client_owner
    });
    
    // Get default user if needed
    let defaultUser = projectData.updated_by;
    if (!defaultUser) {
      const firstUser = await User.findOne().select('_id');
      if (firstUser) {
        defaultUser = firstUser._id;
      }
    }

    // Handle budget field mapping for updates
    const updateFields = { ...projectData };
    if (projectData.budget_amount !== undefined || projectData.currency !== undefined || projectData.budget_type !== undefined) {
      // Get current project to merge budget fields
      const currentProject = await Project.findById(id);
      if (currentProject) {
        updateFields.budget = {
          amount: projectData.budget_amount !== undefined ? projectData.budget_amount : currentProject.budget?.amount || 0,
          currency: projectData.currency !== undefined ? projectData.currency : currentProject.budget?.currency || 'USD',
          type: projectData.budget_type !== undefined ? projectData.budget_type : currentProject.budget?.type || 'Fixed',
          allocated: currentProject.budget?.allocated || 0,
          spent: currentProject.budget?.spent || 0
        };
        // Remove flat budget fields
        delete updateFields.budget_amount;
        delete updateFields.currency;
        delete updateFields.budget_type;
      }
    }

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        ...updateFields,
        updated_by: defaultUser,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedProject) {
      return NextResponse.json({ 
        error: 'Project not found',
        details: `No project found with ID: ${id}` 
      }, { status: 404 });
    }
    
    console.log('Project updated successfully');
    
    // Flatten budget fields for frontend compatibility and normalize IDs
    const updatedProjectData = updatedProject.toObject();
    const flattenedProject = formatForAPI({
      ...updatedProjectData,
      budget_amount: updatedProjectData.budget?.amount || 0,
      currency: updatedProjectData.budget?.currency || 'USD',
      budget_type: updatedProjectData.budget?.type || 'Fixed'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Project updated successfully',
      data: {
        project: flattenedProject
      }
    });
    
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ 
      error: 'Failed to update project',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    
    if (!projectId) {
      return NextResponse.json({ 
        error: 'Project ID is required',
        details: 'Please provide a project ID to delete' 
      }, { status: 400 });
    }
    
    console.log('Deleting project with ID:', projectId);
    
    // Validate ObjectId format
    if (!isValidObjectId(projectId)) {
      return NextResponse.json({ 
        error: 'Invalid project ID format',
        details: 'Project ID must be a valid MongoDB ObjectId' 
      }, { status: 400 });
    }
    
    // First, delete all associated deliverables
    const deliverables = await Deliverable.find({ project: projectId });
    console.log(`Found ${deliverables.length} deliverables to delete for project ${projectId}`);
    
    if (deliverables.length > 0) {
      await Deliverable.deleteMany({ project: projectId });
      console.log(`Deleted ${deliverables.length} deliverables for project ${projectId}`);
    }
    
    // Delete menu items for this project and its deliverables
    console.log('Deleting menu items for project and associated deliverables...');
    
    // Get deliverable IDs
    const deliverableIds = deliverables.map(d => d._id.toString());
    
    // Delete menu items for the project
    await MenuItemModel.deleteMany({ 
      $or: [
        { 'metadata.project_id': projectId },
        { 'metadata.project': projectId }
      ]
    });
    
    // Delete menu items for all deliverables of this project
    if (deliverableIds.length > 0) {
      await MenuItemModel.deleteMany({ 
        $or: [
          { 'metadata.deliverable_id': { $in: deliverableIds } },
          { 'metadata.deliverable': { $in: deliverableIds } }
        ]
      });
    }
    
    console.log('Menu items deleted successfully');
    
    // Delete the project
    const deletedProject = await Project.findByIdAndDelete(projectId);
    
    if (!deletedProject) {
      return NextResponse.json({ 
        error: 'Project not found',
        details: `No project found with ID: ${projectId}` 
      }, { status: 404 });
    }
    
    console.log('Project and all associated deliverables deleted successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Project and all associated deliverables deleted successfully',
      deletedProject: {
        id: deletedProject._id.toString(),
        title: deletedProject.title
      }
    });
    
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ 
      error: 'Failed to delete project',
      details: error.message 
    }, { status: 500 });
  }
}
