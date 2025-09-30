import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import Client from '@/lib/models/Client';
import Organisation from '@/lib/models/Organisation';
import Deliverable from '@/lib/models/Deliverable';
import MenuItemModel from '@/lib/models/MenuItemModel';

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
      projects: projects.map(project => ({
        ...project,
        id: project._id.toString()
      }))
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
    
    // Helper function to find or create user by name/identifier
    const findOrCreateUser = async (identifier) => {
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
      
      if (user) {
        return user._id;
      }
      
      // Return null if not found - we'll use default
      return null;
    };

    // Helper function to find client by name/identifier
    const findClient = async (identifier) => {
      if (!identifier) return null;
      
      // If it's already an ObjectId, return it
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
      
      // Return null if not found
      return null;
    };

    // Resolve user and client references
    let clientId = await findClient(projectData.client_owner);
    
    // If no client found but project requires one, create a default client
    if (!clientId && projectData.client_owner) {
      console.log('Client not found, creating default client for:', projectData.client_owner);
      try {
        const defaultClient = new Client({
          name: projectData.client_owner,
          location: 'Unknown',
          industry: 'Other',
          status: 'active',
          priority: 'medium',
          owner: null, // We'll set this after we get a default user
          organisation: null, // We'll set this after we get default org
          company_size: 'medium',
          tags: [],
          notes: `Auto-created for project: ${projectData.name}`,
          created_by: null, // We'll set this after we get a default user
          updated_by: null // We'll set this after we get a default user
        });
        
        // Get defaults first
        let tempDefaultUser = null;
        let tempDefaultOrg = null;
        
        const firstUser = await User.findOne().select('_id');
        if (firstUser) {
          tempDefaultUser = firstUser._id;
        }
        
        const firstOrg = await Organisation.findOne().select('_id');
        if (firstOrg) {
          tempDefaultOrg = firstOrg._id;
        }
        
        // Set the defaults
        defaultClient.owner = tempDefaultUser;
        defaultClient.organisation = tempDefaultOrg;
        defaultClient.created_by = tempDefaultUser;
        defaultClient.updated_by = tempDefaultUser;
        
        const savedClient = await defaultClient.save();
        clientId = savedClient._id;
        console.log('Created default client with ID:', clientId);
      } catch (clientError) {
        console.error('Failed to create default client:', clientError);
        // Continue without client - we'll handle this later
      }
    }
    
    const internalOwnerId = await findOrCreateUser(projectData.internal_owner);
    const createdById = await findOrCreateUser(projectData.created_by);
    const updatedById = await findOrCreateUser(projectData.updated_by);

    // Get default values if not provided
    let defaultUser = internalOwnerId || createdById;
    let defaultOrganisation = projectData.organisation;
    
    if (!defaultUser) {
      const firstUser = await User.findOne().select('_id');
      if (firstUser) {
        defaultUser = firstUser._id;
        console.log('Using default user:', defaultUser);
      } else {
        return NextResponse.json({ 
          error: 'No user found',
          details: 'Please create a user first or provide user ID' 
        }, { status: 400 });
      }
    }
    
    if (!defaultOrganisation) {
      const firstOrg = await Organisation.findOne().select('_id');
      if (firstOrg) {
        defaultOrganisation = firstOrg._id;
        console.log('Using default organisation:', defaultOrganisation);
      } else {
        return NextResponse.json({ 
          error: 'No organisation found',
          details: 'Please create an organisation first or provide organisation ID' 
        }, { status: 400 });
      }
    }
    
    // Default dates if not provided
    const defaultStartDate = projectData.start_date || new Date();
    const defaultEndDate = projectData.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    // Ensure we have a client (required field)
    if (!clientId) {
      console.log('No client specified, creating default client');
      try {
        const defaultClient = new Client({
          name: 'Default Client',
          location: 'Unknown',
          industry: 'Other',
          status: 'active',
          priority: 'medium',
          owner: defaultUser,
          organisation: defaultOrganisation,
          company_size: 'medium',
          tags: [],
          notes: `Auto-created for project: ${projectData.name || 'Untitled Project'}`,
          created_by: defaultUser,
          updated_by: defaultUser
        });
        
        const savedClient = await defaultClient.save();
        clientId = savedClient._id;
        console.log('Created fallback default client with ID:', clientId);
      } catch (clientError) {
        console.error('Failed to create fallback client:', clientError);
        return NextResponse.json({ 
          error: 'Failed to create project',
          details: 'Could not create required client. Please create a client first or provide a valid client name.' 
        }, { status: 400 });
      }
    }

    // Create the new project
    const newProject = new Project({
      name: projectData.name || 'Untitled Project',
      description: projectData.description || 'Project description',
      start_date: defaultStartDate,
      end_date: defaultEndDate,
      status: projectData.status || 'Planning',
      client: clientId, // Use resolved client ObjectId (now guaranteed to exist)
      client_owner: clientId, // Use resolved client ObjectId (now guaranteed to exist)
      internal_owner: internalOwnerId || defaultUser,
      organisation: defaultOrganisation,
      reference_documents: projectData.reference_documents || [],
      budget: projectData.budget || { amount: projectData.budget_amount || 0, currency: projectData.budget_currency || 'USD', allocated: 0, spent: 0 },
      team_members: projectData.team_members || [],
      staffing: projectData.staffing || [],
      tags: projectData.tags || [],
      priority: projectData.priority || 'medium',
      project_type: projectData.project_type || 'consulting',
      communication_preferences: projectData.communication_preferences || {},
      notes: projectData.notes || '',
      created_by: createdById || defaultUser,
      updated_by: updatedById || defaultUser
    });
    
    const savedProject = await newProject.save();
    console.log('Project created successfully with ID:', savedProject._id);
    
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
        title: savedProject.name || 'Untitled Project',
        description: savedProject.description || '',
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
          client_owner: savedProject.client_owner?.toString(),
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
    } catch (menuError) {
      console.error('Failed to create menu item for project:', menuError);
      // Don't fail the entire request if menu creation fails
    }
    
    return NextResponse.json({ 
      success: true, 
      id: savedProject._id,
      message: 'Project created successfully',
      project: {
        ...savedProject.toObject(),
        id: savedProject._id.toString()
      }
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

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        ...projectData,
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'Project updated successfully',
      project: {
        ...updatedProject.toObject(),
        id: updatedProject._id.toString()
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
    if (!projectId.match(/^[0-9a-fA-F]{24}$/)) {
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
