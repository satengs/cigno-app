import { NextResponse } from 'next/server';
import ChatMessage from '../../../../lib/models/ChatMessage.js';
import connectDB from '../../../../lib/db/mongoose.js';

// GET /api/chat/messages - Get chat messages for a project
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit')) || 50;
    
    if (!projectId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'projectId and userId are required'
      }, { status: 400 });
    }

    const messages = await ChatMessage.getProjectMessages(projectId, userId, limit);
    
    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        count: messages.length
      }
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch chat messages',
      details: error.message
    }, { status: 500 });
  }
}

// POST /api/chat/messages - Create a new chat message
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      threadId,
      projectId,
      userId,
      role,
      content,
      type = 'text',
      aiProvider = null,
      responseTime = null,
      contextData = {}
    } = body;

    // Validate required fields
    if (!threadId || !projectId || !userId || !role || !content) {
      return NextResponse.json({
        success: false,
        error: 'threadId, projectId, userId, role, and content are required'
      }, { status: 400 });
    }

    // Create message
    const messageData = {
      threadId,
      projectId,
      userId,
      role,
      content,
      type,
      aiProvider,
      responseTime,
      contextData
    };

    const message = await ChatMessage.createMessage(messageData);
    
    return NextResponse.json({
      success: true,
      data: { message }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create chat message',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE /api/chat/messages - Delete chat messages for a project
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    
    if (!projectId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'projectId and userId are required'
      }, { status: 400 });
    }

    const result = await ChatMessage.deleteProjectMessages(projectId, userId);
    
    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        message: `Deleted ${result.deletedCount} messages`
      }
    });

  } catch (error) {
    console.error('Error deleting chat messages:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete chat messages',
      details: error.message
    }, { status: 500 });
  }
}