import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Client from '@/lib/models/Client';
import User from '@/lib/models/User';
import Organisation from '@/lib/models/Organisation';
import Contact from '@/lib/models/Contact';
import Project from '@/lib/models/Project';
import Deliverable from '@/lib/models/Deliverable';
import MenuItemModel from '@/lib/models/MenuItemModel';
import { formatForAPI, isValidObjectId } from '@/lib/utils/idUtils';

export async function GET() {
  try {
    await connectDB();
    console.log('Database connected, fetching clients...');
    
    const clients = await Client.findActive()
      .populate('owner', 'first_name last_name email_address')
      .populate('organisation', 'name industry')
      .populate('contacts', 'name email_address job_title')
      .lean();
    
    console.log(`Found ${clients.length} clients`);
    
    return NextResponse.json({ 
      success: true,
      data: { clients: formatForAPI(clients) }
    });
    
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch clients',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const clientData = await request.json();
    
    console.log('Creating new client with raw data:', clientData);
    
    // Handle both 'title' and 'name' fields (frontend sends 'title')
    const clientName = clientData.title || clientData.name;
    
    console.log('Creating new client:', {
      name: clientName,
      industry: clientData.industry || clientData.metadata?.industry
    });
    
    // Validate required fields
    if (!clientName) {
      return NextResponse.json({ 
        error: 'Client name is required',
        details: 'Please provide a client name' 
      }, { status: 400 });
    }

    // Validate user and organization are provided
    let defaultUser = clientData.metadata?.owner || clientData.owner || clientData.created_by;
    let defaultOrganisation = clientData.organisation;
    
    // Handle owner field - convert string IDs to actual user ObjectIds
    if (defaultUser && typeof defaultUser === 'string' && !defaultUser.match(/^[0-9a-fA-F]{24}$/)) {
      // If it's a string like "john-doe", find the actual user
      console.log('Looking up user by identifier:', defaultUser);
      const foundUser = await User.findOne({ 
        $or: [
          { username: defaultUser },
          { email_address: defaultUser },
          { first_name: { $regex: defaultUser, $options: 'i' } }
        ]
      }).select('_id');
      
      if (foundUser) {
        defaultUser = foundUser._id;
        console.log('Found user:', defaultUser);
      } else {
        defaultUser = null;
      }
    }
    
    if (!defaultUser) {
      return NextResponse.json({ 
        error: 'User is required',
        details: 'Please provide a valid owner, created_by user ID, or create a user first' 
      }, { status: 400 });
    }
    
    if (!defaultOrganisation) {
      return NextResponse.json({ 
        error: 'Organisation is required',
        details: 'Please provide a valid organisation ID or create an organisation first' 
      }, { status: 400 });
    }
    
    // Extract data from metadata if present
    const metadata = clientData.metadata || {};
    
    // Create the new client
    const newClient = new Client({
      name: clientName, // Use the resolved name from title/name
      logo: clientData.logo || metadata.logo || null,
      website: clientData.website || metadata.website || null,
      location: clientData.location || metadata.location || 'Unknown',
      industry: clientData.industry || metadata.industry || 'Unknown',
      owner: defaultUser, // Use the resolved user ObjectId
      organisation: defaultOrganisation,
      tags: clientData.tags || metadata.tags || [],
      description: clientData.description || '',
      company_size: clientData.company_size || metadata.company_size || 'medium',
      status: clientData.status || 'active',
      priority: clientData.priority || metadata.priority || 'medium',
      communication_preferences: clientData.communication_preferences || metadata.communicationPreferences || {},
      billing_info: clientData.billing_info || metadata.billingInfo || {},
      notes: clientData.notes || metadata.notes || '',
      created_by: defaultUser, // Use the resolved user ObjectId
      updated_by: defaultUser // Use the resolved user ObjectId
    });
    
    const savedClient = await newClient.save();
    console.log('Client created successfully with ID:', savedClient._id);
    
    return NextResponse.json({ 
      success: true, 
      data: { client: formatForAPI(savedClient) }
    });
    
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ 
      error: 'Failed to create client',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const updateData = await request.json();
    const { id, ...clientData } = updateData;
    
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'Valid ObjectId required',
        details: 'Please provide a valid client ObjectId to update' 
      }, { status: 400 });
    }
    
    console.log('Updating client:', id, {
      name: clientData.name,
      industry: clientData.industry
    });
    
    // Validate updated_by user if provided
    let defaultUser = clientData.updated_by;
    if (defaultUser && typeof defaultUser === 'string' && !defaultUser.match(/^[0-9a-fA-F]{24}$/)) {
      // Look up user if it's not an ObjectId
      const foundUser = await User.findOne({ 
        $or: [
          { username: defaultUser },
          { email_address: defaultUser }
        ]
      }).select('_id');
      
      if (!foundUser) {
        return NextResponse.json({ 
          error: 'Invalid user',
          details: `User not found: ${defaultUser}` 
        }, { status: 400 });
      }
      
      defaultUser = foundUser._id;
    }

    // Update the client
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        ...clientData,
        updated_by: defaultUser,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedClient) {
      return NextResponse.json({ 
        error: 'Client not found',
        details: `No client found with ID: ${id}` 
      }, { status: 404 });
    }
    
    console.log('Client updated successfully');
    
    return NextResponse.json({ 
      success: true, 
      data: { client: formatForAPI(updatedClient) }
    });
    
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ 
      error: 'Failed to update client',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('id');
    
    if (!clientId || !isValidObjectId(clientId)) {
      return NextResponse.json({ 
        error: 'Valid ObjectId required',
        details: 'Please provide a valid client ObjectId to delete' 
      }, { status: 400 });
    }
    
    console.log('🗑️ Deleting client with ID:', clientId);
    
    console.log('✅ ObjectId format valid, proceeding with deletion...');
    
    // First, delete all associated projects and their deliverables
    const projects = await Project.find({ client: clientId });
    console.log(`Found ${projects.length} projects to delete for client ${clientId}`);
    
    for (const project of projects) {
      // Delete all deliverables for this project
      const deliverables = await Deliverable.find({ project: project._id });
      console.log(`Deleting ${deliverables.length} deliverables for project ${project._id}`);
      await Deliverable.deleteMany({ project: project._id });
      
      // Delete the project
      await Project.findByIdAndDelete(project._id);
    }
    
    // Delete all contacts associated with this client
    await Contact.deleteMany({ client: clientId });
    
    // Delete all menu items associated with this client and its projects/deliverables
    console.log('Deleting menu items for client and associated projects/deliverables...');
    
    // Get all project IDs for this client
    const projectIds = projects.map(p => p._id.toString());
    
    // Delete menu items for the client
    await MenuItemModel.deleteMany({ 
      $or: [
        { 'metadata.client_id': clientId },
        { 'metadata.client': clientId },
        { 'assignedClient': clientId }
      ]
    });
    
    // Delete menu items for all projects of this client
    if (projectIds.length > 0) {
      await MenuItemModel.deleteMany({ 
        $or: [
          { 'metadata.project_id': { $in: projectIds } },
          { 'metadata.project': { $in: projectIds } }
        ]
      });
    }
    
    // Delete menu items for all deliverables of this client's projects
    const allDeliverableIds = [];
    for (const project of projects) {
      const deliverables = await Deliverable.find({ project: project._id });
      allDeliverableIds.push(...deliverables.map(d => d._id.toString()));
    }
    
    if (allDeliverableIds.length > 0) {
      await MenuItemModel.deleteMany({ 
        $or: [
          { 'metadata.deliverable_id': { $in: allDeliverableIds } },
          { 'metadata.deliverable': { $in: allDeliverableIds } }
        ]
      });
    }
    
    console.log('Menu items deleted successfully');
    
    // Check if client exists before deletion
    console.log('🔍 Looking for client with ID:', clientId);
    const existingClient = await Client.findById(clientId);
    console.log('🔍 Client lookup result:', existingClient ? 'FOUND' : 'NOT FOUND');
    
    if (existingClient) {
      console.log('📋 Client details:', {
        id: existingClient._id,
        name: existingClient.name,
        industry: existingClient.industry
      });
    }
    
    // Finally, delete the client
    const deletedClient = await Client.findByIdAndDelete(clientId);
    console.log('🗑️ Delete operation result:', deletedClient ? 'SUCCESS' : 'FAILED');
    
    if (!deletedClient) {
      console.log('❌ Client not found for deletion:', clientId);
      // Let's also search for clients with similar IDs to debug
      const allClients = await Client.find({}).select('_id name').limit(5);
      console.log('🔍 Available clients in database:', allClients.map(c => ({ id: c._id.toString(), name: c.name })));
      
      return NextResponse.json({ 
        error: 'Client not found',
        details: `No client found with ID: ${clientId}` 
      }, { status: 404 });
    }
    
    console.log('Client and all associated data deleted successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Client and all associated projects, deliverables, and contacts deleted successfully',
      data: { client: formatForAPI(deletedClient) }
    });
    
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ 
      error: 'Failed to delete client',
      details: error.message 
    }, { status: 500 });
  }
}
