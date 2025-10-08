'use client';

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DeliverableLayoutTypePage() {
  const { id, layoutType } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (id && layoutType) {
      // Redirect to dashboard and let it handle the deliverable selection
      router.replace(`/dashboard?deliverable=${id}&view=layout&layoutType=${layoutType}`);
    }
  }, [id, layoutType, router]);

  return null;
}