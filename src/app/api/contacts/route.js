import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Contact from '@/lib/models/Contact';
import User from '@/lib/models/User';
import Client from '@/lib/models/Client';

export async function GET() {
  try {
    await connectDB();
    console.log('Database connected, fetching contacts...');
    
    const contacts = await Contact.find({})
      .populate('client', 'name industry')
      .populate('created_by', 'first_name last_name email_address')
      .populate('updated_by', 'first_name last_name email_address')
      .sort({ created_at: -1 });
    
    console.log(`Found ${contacts.length} contacts`);
    
    return NextResponse.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch contacts',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    console.log('Database connected, creating contact...');
    
    const body = await request.json();
    console.log('Creating new contact:', body);
    
    const contact = new Contact(body);
    const savedContact = await contact.save();
    
    console.log('Contact created successfully with ID:', savedContact._id);
    
    return NextResponse.json({
      success: true,
      contact: savedContact
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ 
      error: 'Failed to create contact',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    console.log('Database connected, updating contact...');
    
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    if (!_id) {
      return NextResponse.json({ 
        error: 'Contact ID is required for update' 
      }, { status: 400 });
    }
    
    console.log('Updating contact:', _id, updateData);
    
    const updatedContact = await Contact.findByIdAndUpdate(
      _id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('client', 'name industry')
     .populate('created_by', 'first_name last_name email_address')
     .populate('updated_by', 'first_name last_name email_address');
    
    if (!updatedContact) {
      return NextResponse.json({ 
        error: 'Contact not found' 
      }, { status: 404 });
    }
    
    console.log('Contact updated successfully');
    
    return NextResponse.json({
      success: true,
      contact: updatedContact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ 
      error: 'Failed to update contact',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    console.log('Database connected, deleting contact...');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Contact ID is required for deletion' 
      }, { status: 400 });
    }
    
    console.log('Deleting contact:', id);
    
    const deletedContact = await Contact.findByIdAndDelete(id);
    
    if (!deletedContact) {
      return NextResponse.json({ 
        error: 'Contact not found' 
      }, { status: 404 });
    }
    
    console.log('Contact deleted successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ 
      error: 'Failed to delete contact',
      details: error.message 
    }, { status: 500 });
  }
}
