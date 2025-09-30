import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import DataPublisher from '@/lib/models/DataPublisher';
import User from '@/lib/models/User';
import Organisation from '@/lib/models/Organisation';
import Project from '@/lib/models/Project';

export async function GET() {
  try {
    await connectDB();
    console.log('Database connected, fetching data publishers...');
    
    const dataPublishers = await DataPublisher.findActive()
      .populate('organisation', 'name industry')
      .populate('projects', 'name status')
      .populate('created_by', 'first_name last_name email_address')
      .populate('updated_by', 'first_name last_name email_address')
      .lean();
    
    console.log(`Found ${dataPublishers.length} data publishers`);
    
    return NextResponse.json({ 
      success: true,
      dataPublishers: dataPublishers.map(publisher => ({
        ...publisher,
        id: publisher._id.toString()
      }))
    });
    
  } catch (error) {
    console.error('Error fetching data publishers:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data publishers',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const publisherData = await request.json();
    
    console.log('Creating new data publisher:', {
      name: publisherData.name,
      url: publisherData.url
    });
    
    // Create the new data publisher
    const newPublisher = new DataPublisher({
      name: publisherData.name,
      url: publisherData.url,
      languages: publisherData.languages || ['en'],
      content: publisherData.content || '',
      content_type: publisherData.content_type || 'manual_entry',
      update_frequency: publisherData.update_frequency || 'manual',
      organisation: publisherData.organisation,
      projects: publisherData.projects || [],
      tags: publisherData.tags || [],
      metadata: publisherData.metadata || {},
      created_by: publisherData.created_by,
      updated_by: publisherData.updated_by
    });
    
    const savedPublisher = await newPublisher.save();
    console.log('Data publisher created successfully with ID:', savedPublisher._id);
    
    return NextResponse.json({ 
      success: true, 
      id: savedPublisher._id,
      message: 'Data publisher created successfully',
      dataPublisher: {
        ...savedPublisher.toObject(),
        id: savedPublisher._id.toString()
      }
    });
    
  } catch (error) {
    console.error('Error creating data publisher:', error);
    return NextResponse.json({ 
      error: 'Failed to create data publisher',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const publisherData = await request.json();
    const { _id, ...updateData } = publisherData;
    
    if (!_id) {
      return NextResponse.json({ 
        error: 'Data publisher ID is required for update' 
      }, { status: 400 });
    }
    
    console.log('Updating data publisher:', _id, updateData);
    
    const updatedPublisher = await DataPublisher.findByIdAndUpdate(
      _id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('organisation', 'name industry')
     .populate('projects', 'name status')
     .populate('created_by', 'first_name last_name email_address')
     .populate('updated_by', 'first_name last_name email_address');
    
    if (!updatedPublisher) {
      return NextResponse.json({ 
        error: 'Data publisher not found' 
      }, { status: 404 });
    }
    
    console.log('Data publisher updated successfully');
    
    return NextResponse.json({
      success: true,
      dataPublisher: {
        ...updatedPublisher.toObject(),
        id: updatedPublisher._id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating data publisher:', error);
    return NextResponse.json({ 
      error: 'Failed to update data publisher',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Data publisher ID is required for deletion' 
      }, { status: 400 });
    }
    
    console.log('Deleting data publisher:', id);
    
    const deletedPublisher = await DataPublisher.findByIdAndDelete(id);
    
    if (!deletedPublisher) {
      return NextResponse.json({ 
        error: 'Data publisher not found' 
      }, { status: 404 });
    }
    
    console.log('Data publisher deleted successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Data publisher deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting data publisher:', error);
    return NextResponse.json({ 
      error: 'Failed to delete data publisher',
      details: error.message 
    }, { status: 500 });
  }
}
