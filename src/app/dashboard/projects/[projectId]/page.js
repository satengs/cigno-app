'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const LegacyProjectRoute = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId;

  useEffect(() => {
    if (projectId) {
      router.replace(`/project/${projectId}`);
    }
  }, [projectId, router]);

  return null;
};

export default LegacyProjectRoute;

