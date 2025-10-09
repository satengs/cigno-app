import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db/mongoose';
import User from '../../../lib/models/User';
import Organisation from '../../../lib/models/Organisation';
import Client from '../../../lib/models/Client';
import Project from '../../../lib/models/Project';
import Deliverable from '../../../lib/models/Deliverable';

export async function GET() {
  try {
    await connectDB();
    console.log('Database connected, fetching users...');
    
    const users = await User.findActive()
      .populate('organisation', 'name industry')
      .populate('clients', 'name industry')
      .populate('projects', 'name status')
      .populate('deliverables', 'name status')
      .lean();
    
    console.log(`Found ${users.length} users`);
    
    return NextResponse.json({ 
      success: true,
      users: users.map(user => ({
        ...user,
        id: user._id.toString(),
        // Remove sensitive data
        password: undefined
      }))
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const userData = await request.json();
    
    console.log('Creating new user:', {
      email: userData.email_address,
      first_name: userData.first_name,
      last_name: userData.last_name
    });
    
    // Create the new user
    const newUser = new User({
      first_name: userData.first_name,
      last_name: userData.last_name,
      job_title: userData.job_title,
      location: userData.location,
      phone_number: userData.phone_number,
      email_address: userData.email_address,
      linkedin_url: userData.linkedin_url,
      bio: userData.bio,
      languages_spoken: userData.languages_spoken || [],
      industry_expertise: userData.industry_expertise || [],
      area_of_expertise: userData.area_of_expertise || [],
      tags: userData.tags || [],
      notification_preferences: userData.notification_preferences || {},
      app_preferences: userData.app_preferences || {},
      password: userData.password,
      organisation: userData.organisation,
      created_by: userData.created_by,
      updated_by: userData.updated_by
    });
    
    const savedUser = await newUser.save();
    console.log('User created successfully with ID:', savedUser._id);
    
    // Add user to organisation
    if (userData.organisation) {
      const Organisation = (await import('../../../lib/models/Organisation')).default;
      await Organisation.findByIdAndUpdate(
        userData.organisation,
        { $push: { users: savedUser._id } }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      id: savedUser._id,
      message: 'User created successfully',
      user: {
        ...savedUser.toObject(),
        id: savedUser._id.toString(),
        password: undefined
      }
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: error.message 
    }, { status: 500 });
  }
}
