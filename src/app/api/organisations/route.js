import { NextResponse } from 'next/server';
import connectDB from '../../lib/db/mongoose';
import Organisation from '../../lib/models/Organisation';
import User from '../../lib/models/User';

export async function GET() {
  try {
    await connectDB();
    console.log('Database connected, fetching organisations...');
    
    const organisations = await Organisation.findActive()
      .populate('admin', 'first_name last_name email_address')
      .populate('users', 'first_name last_name email_address')
      .lean();
    
    console.log(`Found ${organisations.length} organisations`);
    
    return NextResponse.json({ 
      success: true,
      organisations: organisations.map(org => ({
        ...org,
        id: org._id.toString()
      }))
    });
    
  } catch (error) {
    console.error('Error fetching organisations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch organisations',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const organisationData = await request.json();
    
    console.log('Creating new organisation:', {
      name: organisationData.name,
      industry: organisationData.industry
    });
    
    // Create the new organisation
    const newOrganisation = new Organisation({
      name: organisationData.name,
      logo: organisationData.logo || null,
      website: organisationData.website || null,
      locations: organisationData.locations || [],
      industry: organisationData.industry,
      admin: organisationData.admin,
      tags: organisationData.tags || [],
      billing_info: organisationData.billing_info || {},
      created_by: organisationData.created_by,
      updated_by: organisationData.updated_by
    });
    
    const savedOrganisation = await newOrganisation.save();
    console.log('Organisation created successfully with ID:', savedOrganisation._id);
    
    return NextResponse.json({ 
      success: true, 
      id: savedOrganisation._id,
      message: 'Organisation created successfully',
      organisation: {
        ...savedOrganisation.toObject(),
        id: savedOrganisation._id.toString()
      }
    });
    
  } catch (error) {
    console.error('Error creating organisation:', error);
    return NextResponse.json({ 
      error: 'Failed to create organisation',
      details: error.message 
    }, { status: 500 });
  }
}
