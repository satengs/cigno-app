import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db/mongoose';
import MenuItemModel from '../../../lib/models/MenuItemModel';

export async function POST() {
  try {
    await connectDB();
    console.log('Database connected, starting seed operation...');
    
    // Clear existing data
    await MenuItemModel.deleteMany({});
    console.log('Cleared existing menu items');
    
    // Create Global Banking Corp client (matching the images)
    const globalBankingClient = new MenuItemModel({
      title: 'Global Banking Corp',
      description: 'Financial Services Client',
      type: 'client',
      status: 'active',
      order: 0,
      isCollapsed: false,
      isCollapsible: true,
      children: [], // Will be populated with project IDs
      metadata: {
        industry: 'Financial Services',
        contactPerson: 'John Smith',
        email: 'john.smith@globalbanking.com',
        status: 'Active'
      }
    });
    
    const savedClient = await globalBankingClient.save();
    console.log('✅ Global Banking Corp client created:', savedClient._id);
    
    // Create CBDC Implementation Strategy project
    const cbdcProject = new MenuItemModel({
      title: 'CBDC Implementation Strategy',
      description: 'Central Bank Digital Currency Strategy',
      type: 'project',
      status: 'active',
      parentId: savedClient._id, // Assign to client
      order: 0,
      isCollapsed: false,
      isCollapsible: true,
      children: [], // Will be populated with deliverable IDs
      assignedClient: savedClient._id, // Reference to client
      metadata: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        budget: 500000,
        manager: 'Sarah Johnson',
        status: 'Active'
      }
    });
    
    const savedProject = await cbdcProject.save();
    console.log('✅ CBDC Implementation Strategy project created:', savedProject._id);
    
    // Create CBDC Strategy Presentation deliverable
    const presentationDeliverable = new MenuItemModel({
      title: 'CBDC Strategy Presentation',
      description: 'Executive presentation for CBDC implementation',
      type: 'deliverable',
      status: 'active',
      parentId: savedProject._id, // Assign to project
      order: 0,
      isCollapsed: false,
      isCollapsible: false, // Deliverables can't have children
      brief: 'Create a comprehensive CBDC strategy presentation',
      dueDate: new Date('2024-06-30'),
      priority: 'high',
      teamMembers: ['Sarah Johnson', 'Michael Chen'],
      metadata: {
        category: 'Presentation',
        estimatedHours: 80,
        dependencies: ['Market Research'],
        status: 'Active'
      }
    });
    
    const savedPresentation = await presentationDeliverable.save();
    console.log('✅ CBDC Strategy Presentation created:', savedPresentation._id);
    
    // Create Technical Report deliverable
    const technicalReport = new MenuItemModel({
      title: 'Technical Report',
      description: 'Technical implementation details for CBDC',
      type: 'deliverable',
      status: 'not-started',
      parentId: savedProject._id, // Assign to project
      order: 1,
      isCollapsed: false,
      isCollapsible: false,
      brief: 'Create technical specifications and implementation details',
      dueDate: new Date('2024-08-30'),
      priority: 'medium',
      teamMembers: ['Michael Chen', 'Alice Johnson'],
      metadata: {
        category: 'Documentation',
        estimatedHours: 120,
        dependencies: ['CBDC Strategy Presentation'],
        status: 'Not Started'
      }
    });
    
    const savedTechnicalReport = await technicalReport.save();
    console.log('✅ Technical Report created:', savedTechnicalReport._id);
    
    // Create Implementation Roadmap deliverable
    const implementationRoadmap = new MenuItemModel({
      title: 'Implementation Roadmap',
      description: 'Project timeline and milestones for CBDC implementation',
      type: 'deliverable',
      status: 'not-started',
      parentId: savedProject._id, // Assign to project
      order: 2,
      isCollapsed: false,
      isCollapsible: false,
      brief: 'Create detailed implementation roadmap with milestones',
      dueDate: new Date('2024-10-30'),
      priority: 'medium',
      teamMembers: ['Sarah Johnson', 'Bob Wilson'],
      metadata: {
        category: 'Planning',
        estimatedHours: 60,
        dependencies: ['Technical Report'],
        status: 'Not Started'
      }
    });
    
    const savedRoadmap = await implementationRoadmap.save();
    console.log('✅ Implementation Roadmap created:', savedRoadmap._id);
    
    // Update client with project ID
    await MenuItemModel.findByIdAndUpdate(
      savedClient._id,
      { $push: { children: savedProject._id } }
    );
    console.log('✅ Updated client with project ID');
    
    // Update project with all deliverable IDs
    await MenuItemModel.findByIdAndUpdate(
      savedProject._id,
      { 
        $push: { 
          children: { 
            $each: [savedPresentation._id, savedTechnicalReport._id, savedRoadmap._id] 
          } 
        } 
      }
    );
    console.log('✅ Updated project with all deliverable IDs');
    
    // Fetch the complete structure to return
    const allItems = await MenuItemModel.find({}).lean();
    
    // Build the hierarchical structure
    const itemMap = new Map();
    const rootItems = [];
    
    // First pass: create a map of all items
    allItems.forEach(item => {
      itemMap.set(item._id.toString(), {
        ...item,
        id: item._id.toString(),
        children: []
      });
    });
    
    // Second pass: build the hierarchy
    allItems.forEach(item => {
      const itemWithId = itemMap.get(item._id.toString());
      
      if (item.parentId) {
        const parent = itemMap.get(item.parentId.toString());
        if (parent) {
          parent.children.push(itemWithId);
        }
      } else {
        rootItems.push(itemWithId);
      }
    });
    
    console.log('🎉 Seed operation completed successfully!');
    console.log('📊 Created structure:', {
      client: savedClient.title,
      project: savedProject.title,
      deliverables: [savedPresentation.title, savedTechnicalReport.title, savedRoadmap.title],
      clientId: savedClient._id,
      projectId: savedProject._id,
      deliverableIds: [savedPresentation._id, savedTechnicalReport._id, savedRoadmap._id]
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully with CBDC data',
      data: {
        rootItems,
        createdItems: {
          client: {
            id: savedClient._id,
            title: savedClient.title,
            projectIds: savedClient.children
          },
          project: {
            id: savedProject._id,
            title: savedProject.title,
            clientId: savedProject.assignedClient,
            deliverableIds: savedProject.children
          },
          deliverables: [
            {
              id: savedPresentation._id,
              title: savedPresentation.title,
              projectId: savedPresentation.parentId,
              status: 'Active'
            },
            {
              id: savedTechnicalReport._id,
              title: savedTechnicalReport.title,
              projectId: savedTechnicalReport.parentId,
              status: 'Not Started'
            },
            {
              id: savedRoadmap._id,
              title: savedRoadmap.title,
              projectId: savedRoadmap.parentId,
              status: 'Not Started'
            }
          ]
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Error seeding database:', error);
    return NextResponse.json({ 
      error: 'Failed to seed database',
      details: error.message 
    }, { status: 500 });
  }
}
