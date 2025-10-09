import { NextResponse } from 'next/server';
import KeyPerson from '../../../../lib/models/KeyPerson';
import connectDB from '../../../../lib/db/mongoose';
import mongoose from 'mongoose';

// GET /api/key-persons/[id]
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid key person ID format' },
        { status: 400 }
      );
    }

    const keyPerson = await KeyPerson.findById(id)
      .populate('client', 'name')
      .lean();

    if (!keyPerson) {
      return NextResponse.json(
        { success: false, error: 'Key person not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { keyPerson }
    });

  } catch (error) {
    console.error('Error fetching key person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch key person' },
      { status: 500 }
    );
  }
}

// PUT /api/key-persons/[id]
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid key person ID format' },
        { status: 400 }
      );
    }

    // Clean update data
    const cleanUpdateData = {};
    if (body.full_name) cleanUpdateData.full_name = body.full_name.trim();
    if (body.role) cleanUpdateData.role = body.role.trim();
    if (body.email) cleanUpdateData.email = body.email.toLowerCase().trim();
    if (body.image !== undefined) cleanUpdateData.image = body.image?.trim() || null;
    if (body.phone !== undefined) cleanUpdateData.phone = body.phone?.trim() || null;
    if (body.is_primary !== undefined) cleanUpdateData.is_primary = body.is_primary;
    if (body.is_active !== undefined) cleanUpdateData.is_active = body.is_active;
    
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

// DELETE /api/key-persons/[id]
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;

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

// PATCH /api/key-persons/[id] - Set as primary contact
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    const { action } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid key person ID format' },
        { status: 400 }
      );
    }

    const keyPerson = await KeyPerson.findById(id);
    if (!keyPerson) {
      return NextResponse.json(
        { success: false, error: 'Key person not found' },
        { status: 404 }
      );
    }

    if (action === 'set_primary') {
      await keyPerson.setPrimary();
      
      const updatedKeyPerson = await KeyPerson.findById(id)
        .populate('client', 'name')
        .lean();

      return NextResponse.json({
        success: true,
        data: { keyPerson: updatedKeyPerson },
        message: 'Key person set as primary contact'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating key person:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update key person' },
      { status: 500 }
    );
  }
}
