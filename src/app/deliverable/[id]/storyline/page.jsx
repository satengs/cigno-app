'use client';

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DeliverableStorylinePage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      // Redirect to dashboard and let it handle the deliverable selection
      router.replace(`/dashboard?deliverable=${id}&view=storyline`);
    }
  }, [id, router]);

  return null;
}