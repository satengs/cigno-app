import { NextRequest, NextResponse } from 'next/server';
import MenuService from '../../../../lib/services/MenuService.js';

const menuService = new MenuService();

// PATCH /api/menu/[id] - Partial update of menu item
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({
        ok: false,
        error: 'Menu item ID is required'
      }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validate that we have some data to update
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'No update data provided'
      }, { status: 400 });
    }
    
    // Only allow updating specific fields
    const allowedFields = ['title', 'icon', 'viewId', 'order', 'permissions'];
    const updateData = {};
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'No valid fields to update'
      }, { status: 400 });
    }
    
    const updatedItem = await menuService.update(id, updateData);
    
    return NextResponse.json({
      ok: true,
      data: updatedItem
    });
  } catch (error) {
    console.error('Menu PATCH error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({
        ok: false,
        error: 'Validation failed',
        details: error.details
      }, { status: 400 });
    }
    
    // Handle not found errors
    if (error.message.includes('not found')) {
      return NextResponse.json({
        ok: false,
        error: 'Menu item not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to update menu item'
    }, { status: 500 });
  }
}

// DELETE /api/menu/[id] - Remove menu item (soft delete)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({
        ok: false,
        error: 'Menu item ID is required'
      }, { status: 400 });
    }
    
    const deletedItem = await menuService.remove(id);
    
    return NextResponse.json({
      ok: true,
      data: deletedItem
    });
  } catch (error) {
    console.error('Menu DELETE error:', error);
    
    // Handle not found errors
    if (error.message.includes('not found')) {
      return NextResponse.json({
        ok: false,
        error: 'Menu item not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to delete menu item'
    }, { status: 500 });
  }
}
