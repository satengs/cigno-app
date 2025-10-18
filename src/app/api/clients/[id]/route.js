import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db/mongoose';
import Client from '../../../../lib/models/Client';
import User from '../../../../lib/models/User';
import { formatForAPI, isValidObjectId } from '../../../../lib/utils/idUtils';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const client = await Client.findById(id)
      .populate('owner', 'first_name last_name email_address')
      .populate('organisation', 'name industry')
      .populate('contacts', 'name email_address job_title');

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { client: formatForAPI(client) }
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const updateData = await request.json();
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    console.log('Updating client:', id, updateData);

    // Handle direct fields
    const updateFields = {};
    
    if (updateData.name) {
      updateFields.name = updateData.name;
    }
    
    if (updateData.website !== undefined) {
      updateFields.website = updateData.website;
    }
    
    if (updateData.location !== undefined) {
      updateFields.location = updateData.location;
    }
    
    if (updateData.industry !== undefined) {
      updateFields.industry = updateData.industry;
    }
    
    if (updateData.tags !== undefined) {
      updateFields.tags = updateData.tags;
    }
    
    // Handle owner field
    if (updateData.owner) {
      let ownerId = updateData.owner;
      
      // If owner is not an ObjectId, try to find the user
      if (typeof ownerId === 'string' && !ownerId.match(/^[0-9a-fA-F]{24}$/)) {
        const foundUser = await User.findOne({ 
          $or: [
            { username: ownerId },
            { email_address: ownerId },
            { first_name: { $regex: ownerId, $options: 'i' } }
          ]
        }).select('_id');
        
        if (foundUser) {
          ownerId = foundUser._id;
        }
      }
      
      updateFields.owner = ownerId;
    }

    // Add update tracking
    updateFields.updated_at = new Date();

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('owner', 'first_name last_name email_address')
     .populate('organisation', 'name industry');

    if (!updatedClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    console.log('✅ Client updated successfully');

    return NextResponse.json({
      success: true,
      data: { client: formatForAPI(updatedClient) }
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const deletedClient = await Client.findByIdAndDelete(id);

    if (!deletedClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
      data: { client: formatForAPI(deletedClient) }
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}