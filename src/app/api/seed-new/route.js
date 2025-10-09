import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db/mongoose';
import { Organisation, User, Client, Project, Deliverable, Contact } from '../../../lib/models';

export async function POST() {
  try {
    await connectDB();
    console.log('Database connected, starting new seed operation...');

    // Clear existing data
    await Promise.all([
      Organisation.deleteMany({}),
      User.deleteMany({}),
      Client.deleteMany({}),
      Project.deleteMany({}),
      Deliverable.deleteMany({}),
      Contact.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create test organisation with minimal required fields
    const testOrganisation = new Organisation({
      name: 'Test Organisation',
      industry: 'Technology',
      admin: null, // Will be set after creating admin user
      created_by: null, // Will be set after creating admin user
      updated_by: null
    });

    // Save organisation first (without admin user)
    const savedOrganisation = await testOrganisation.save();
    console.log('✅ Test organisation created:', savedOrganisation._id);

    // Create admin user with minimal required fields
    const adminUser = new User({
      first_name: 'Admin',
      last_name: 'User',
      email_address: 'admin@testorg.com',
      location: 'New York, NY',
      password: 'password123',
      organisation: savedOrganisation._id,
      created_by: null, // Will be set after saving
      updated_by: null
    });

    // Save admin user
    const savedAdminUser = await adminUser.save();
    console.log('✅ Admin user created:', savedAdminUser._id);

    // Update admin user with self-references
    savedAdminUser.created_by = savedAdminUser._id;
    savedAdminUser.updated_by = savedAdminUser._id;
    await savedAdminUser.save();

    // Update organisation with admin user
    savedOrganisation.admin = savedAdminUser._id;
    savedOrganisation.created_by = savedAdminUser._id;
    savedOrganisation.updated_by = savedAdminUser._id;
    savedOrganisation.users = [savedAdminUser._id];
    await savedOrganisation.save();

    // Create test client with minimal required fields
    const testClient = new Client({
      name: 'Test Client Corp',
      industry: 'Finance',
      location: 'Los Angeles, CA',
      owner: savedAdminUser._id,
      organisation: savedOrganisation._id,
      created_by: savedAdminUser._id,
      updated_by: savedAdminUser._id
    });

    const savedClient = await testClient.save();
    console.log('✅ Test client created:', savedClient._id);

    // Create test contact with minimal required fields
    const testContact = new Contact({
      name: 'John Smith',
      email_address: 'john.smith@testclient.com',
      client: savedClient._id,
      created_by: savedAdminUser._id,
      updated_by: savedAdminUser._id
    });

    const savedContact = await testContact.save();
    console.log('✅ Test contact created:', savedContact._id);

    // Update client with contact
    savedClient.contacts = [savedContact._id];
    await savedClient.save();

    // Create test project with minimal required fields
    const testProject = new Project({
      name: 'Digital Transformation Initiative',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      client_owner: savedClient._id,
      internal_owner: savedAdminUser._id,
      organisation: savedOrganisation._id,
      created_by: savedAdminUser._id,
      updated_by: savedAdminUser._id
    });

    const savedProject = await testProject.save();
    console.log('✅ Test project created:', savedProject._id);

    // Create test deliverable with minimal required fields
    const testDeliverable = new Deliverable({
      name: 'Digital Strategy Report',
      project: savedProject._id,
      due_date: new Date('2024-03-15'),
      brief: 'Comprehensive digital strategy report outlining transformation roadmap',
      created_by: savedAdminUser._id,
      updated_by: savedAdminUser._id
    });

    const savedDeliverable = await testDeliverable.save();
    console.log('✅ Test deliverable created:', savedDeliverable._id);

    // Update project with deliverable
    savedProject.deliverables = [savedDeliverable._id];
    await savedProject.save();

    // Update client with project
    savedClient.projects = [savedProject._id];
    await savedClient.save();

    // Update user with client and project
    savedAdminUser.clients = [savedClient._id];
    savedAdminUser.projects = [savedProject._id];
    savedAdminUser.deliverables = [savedDeliverable._id];
    await savedAdminUser.save();

    console.log('🎉 New seed operation completed successfully!');
    console.log('📊 Created structure:', {
      organisation: savedOrganisation.name,
      admin: `${savedAdminUser.first_name} ${savedAdminUser.last_name}`,
      client: savedClient.name,
      contact: savedContact.name,
      project: savedProject.name,
      deliverable: savedDeliverable.name,
      organisationId: savedOrganisation._id,
      adminId: savedAdminUser._id,
      clientId: savedClient._id,
      contactId: savedContact._id,
      projectId: savedProject._id,
      deliverableId: savedDeliverable._id
    });

    return NextResponse.json({
      success: true,
      message: 'New seed data created successfully',
      data: {
        organisation: savedOrganisation._id,
        admin: savedAdminUser._id,
        client: savedClient._id,
        contact: savedContact._id,
        project: savedProject._id,
        deliverable: savedDeliverable._id
      }
    });

  } catch (error) {
    console.error('Error in new seed operation:', error);
    return NextResponse.json({ 
      error: 'Failed to create seed data',
      details: error.message 
    }, { status: 500 });
  }
}
