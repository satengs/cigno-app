import { NextResponse } from 'next/server';
import connectDB from '../../lib/db/mongoose';
import mongoose from 'mongoose';
import { Organisation, User, Client, Project, Deliverable, Contact } from '../../lib/models';

export async function POST() {
  try {
    await connectDB();
    console.log('Database connected, starting clean seed operation...');

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

    // Create a minimal user with a temporary organisation ID
    const tempOrgId = new mongoose.Types.ObjectId();
    
    const tempUser = new User({
      first_name: 'Admin',
      last_name: 'User',
      job_title: 'Administrator',
      location: 'New York, NY',
      email_address: 'admin@example.com',
      password: 'password123',
      organisation: tempOrgId
    });

    const savedTempUser = await tempUser.save();
    console.log('✅ Temp user created:', savedTempUser._id);

    // Update temp user with self-references
    savedTempUser.created_by = savedTempUser._id;
    savedTempUser.updated_by = savedTempUser._id;
    await savedTempUser.save();

    // Create organisation with temp user as admin
    const testOrganisation = new Organisation({
      name: 'Test Organisation',
      industry: 'Technology',
      admin: savedTempUser._id,
      created_by: savedTempUser._id,
      updated_by: savedTempUser._id
    });

    const savedOrganisation = await testOrganisation.save();
    console.log('✅ Test organisation created:', savedOrganisation._id);

    // Update temp user with real organisation ID
    savedTempUser.organisation = savedOrganisation._id;
    await savedTempUser.save();

    // Create client
    const testClient = new Client({
      name: 'Test Client Corp',
      industry: 'Finance',
      location: 'Los Angeles, CA',
      owner: savedTempUser._id,
      organisation: savedOrganisation._id,
      created_by: savedTempUser._id,
      updated_by: savedTempUser._id
    });

    const savedClient = await testClient.save();
    console.log('✅ Test client created:', savedClient._id);

    // Create contact
    const testContact = new Contact({
      name: 'John Smith',
      email_address: 'john.smith@testclient.com',
      client: savedClient._id,
      created_by: savedTempUser._id,
      updated_by: savedTempUser._id
    });

    const savedContact = await testContact.save();
    console.log('✅ Test contact created:', savedContact._id);

    // Create project
    const testProject = new Project({
      name: 'Digital Transformation Initiative',
      description: 'A comprehensive digital transformation project',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      client_owner: savedClient._id,
      internal_owner: savedTempUser._id,
      organisation: savedOrganisation._id,
      created_by: savedTempUser._id,
      updated_by: savedTempUser._id
    });

    const savedProject = await testProject.save();
    console.log('✅ Test project created:', savedProject._id);

    // Create deliverable
    const testDeliverable = new Deliverable({
      name: 'Digital Strategy Report',
      project: savedProject._id,
      due_date: new Date('2024-03-15'),
      brief: 'Comprehensive digital strategy report outlining transformation roadmap',
      created_by: savedTempUser._id,
      updated_by: savedTempUser._id
    });

    const savedDeliverable = await testDeliverable.save();
    console.log('✅ Test deliverable created:', savedDeliverable._id);

    // Update relationships
    savedOrganisation.users = [savedTempUser._id];
    await savedOrganisation.save();

    savedClient.contacts = [savedContact._id];
    savedClient.projects = [savedProject._id];
    await savedClient.save();

    savedProject.deliverables = [savedDeliverable._id];
    await savedProject.save();

    savedTempUser.clients = [savedClient._id];
    savedTempUser.projects = [savedProject._id];
    savedTempUser.deliverables = [savedDeliverable._id];
    await savedTempUser.save();

    console.log('🎉 Clean seed operation completed successfully!');
    console.log('📊 Created structure:', {
      organisation: savedOrganisation.name,
      user: `${savedTempUser.first_name} ${savedTempUser.last_name}`,
      client: savedClient.name,
      contact: savedContact.name,
      project: savedProject.name,
      deliverable: savedDeliverable.name
    });

    return NextResponse.json({
      success: true,
      message: 'Clean seed data created successfully',
      data: {
        organisation: savedOrganisation._id,
        user: savedTempUser._id,
        client: savedClient._id,
        contact: savedContact._id,
        project: savedProject._id,
        deliverable: savedDeliverable._id
      }
    });

  } catch (error) {
    console.error('Error in clean seed operation:', error);
    return NextResponse.json({ 
      error: 'Failed to create seed data',
      details: error.message 
    }, { status: 500 });
  }
}
