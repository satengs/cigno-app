import { NextResponse } from 'next/server';
import KeyPerson from '../../../lib/models/KeyPerson';
import Client from '../../../lib/models/Client';
import connectDB from '../../../lib/db/mongoose';
import mongoose from 'mongoose';

// GET /api/key-persons
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    let query = {};
    
    if (clientId) {
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid client ID format' },
          { status: 400 }
        );
      }
      query.client = clientId;
    }
    
    if (!includeInactive) {
      query.is_active = true;
    }

    const keyPersons = await KeyPerson.find(query)
      .populate('client', 'name')
      .sort({ is_primary: -1, full_name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: { keyPersons }
    });

  } catch (error) {
    console.error('Error fetching key persons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch key persons' },
      { status: 500 }
    );
  }
}

// POST /api/key-persons
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('📝 Creating key person:', body);
    
    const {
      full_name,
      role,
      email,
      image,
      phone,
      client,
      is_primary = false
    } = body;

    // Validate required fields
    if (!full_name || !role || !email || !client) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: full_name, role, email, client' },
        { status: 400 }
      );
    }

    // Validate client exists
    if (!mongoose.Types.ObjectId.isValid(client)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format' },
        { status: 400 }
      );
    }

    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check for duplicate email within the same client
    const existingKeyPerson = await KeyPerson.findOne({ 
      email: email.toLowerCase(),
      client,
      is_active: true
    });

    if (existingKeyPerson) {
      return NextResponse.json(
        { success: false, error: 'A key person with this email already exists for this client' },
        { status: 400 }
      );
    }

    // Create key person
    const keyPersonData = {
      full_name: full_name.trim(),
      role: role.trim(),
      email: email.toLowerCase().trim(),
      client,
      is_primary,
      is_active: true
    };

    if (image) keyPersonData.image = image.trim();
    if (phone) keyPersonData.phone = phone.trim();

    const keyPerson = new KeyPerson(keyPersonData);
    await keyPerson.save();

    // Populate client data for response
    const populatedKeyPerson = await KeyPerson.findById(keyPerson._id)
      .populate('client', 'name')
      .lean();

    console.log('✅ Key person created successfully:', populatedKeyPerson._id);

    return NextResponse.json({
      success: true,
      data: { keyPerson: populatedKeyPerson }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating key person:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error occurred while creating key person' },
      { status: 500 }
    );
  }
}

// PUT /api/key-persons
export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Key person ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid key person ID format' },
        { status: 400 }
      );
    }

    // Clean update data
    const cleanUpdateData = {};
    if (updateData.full_name) cleanUpdateData.full_name = updateData.full_name.trim();
    if (updateData.role) cleanUpdateData.role = updateData.role.trim();
    if (updateData.email) cleanUpdateData.email = updateData.email.toLowerCase().trim();
    if (updateData.image !== undefined) cleanUpdateData.image = updateData.image?.trim() || null;
    if (updateData.phone !== undefined) cleanUpdateData.phone = updateData.phone?.trim() || null;
    if (updateData.is_primary !== undefined) cleanUpdateData.is_primary = updateData.is_primary;
    if (updateData.is_active !== undefined) cleanUpdateData.is_active = updateData.is_active;
    
    cleanUpdateData.updated_at = new Date();

    // Check for duplicate email if email is being updated
    if (cleanUpdateData.email) {
      const keyPerson = await KeyPerson.findById(id);
      if (!keyPerson) {
        return NextResponse.json(
          { success: false, error: 'Key person not found' },
          { status: 404 }
        );
      }

      const existingKeyPerson = await KeyPerson.findOne({ 
        email: cleanUpdateData.email,
        client: keyPerson.client,
        _id: { $ne: id },
        is_active: true
      });

      if (existingKeyPerson) {
        return NextResponse.json(
          { success: false, error: 'A key person with this email already exists for this client' },
          { status: 400 }
        );
      }
    }

    const updatedKeyPerson = await KeyPerson.findByIdAndUpdate(
      id,
      cleanUpdateData,
      { new: true, runValidators: true }
    ).populate('client', 'name').lean();

    if (!updatedKeyPerson) {
      return NextResponse.json(
        { success: false, error: 'Key person not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { keyPerson: updatedKeyPerson }
    });

  } catch (error) {
    console.error('Error updating key person:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update key person' },
      { status: 500 }
    );
  }
}

// DELETE /api/key-persons
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Key person ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid key person ID format' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const keyPerson = await KeyPerson.findByIdAndUpdate(
      id,
      { 
        is_active: false, 
        updated_at: new Date() 
      },
      { new: true }
    );

    if (!keyPerson) {
      return NextResponse.json(
        { success: false, error: 'Key person not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Key person deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting key person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete key person' },
      { status: 500 }
    );
  }
}