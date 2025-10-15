import { NextResponse } from 'next/server';
import { scoreBriefWithAgent } from '../../../../lib/ai/scoreBriefAgent';

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { deliverableId, currentBrief, deliverableData, projectData } = body || {};

  if (!deliverableId) {
    return NextResponse.json({ error: 'Deliverable ID is required' }, { status: 400 });
  }

  if (!currentBrief) {
    return NextResponse.json({ error: 'Current brief content is required' }, { status: 400 });
  }

  const result = await scoreBriefWithAgent({
    deliverableId,
    brief: currentBrief,
    deliverableData,
    projectData
  });

  return NextResponse.json({
    success: result.success,
    deliverableId,
    source: result.source,
    agentId: result.agentId,
    data: result.data,
    fallbackReason: result.fallbackReason
  });
}
