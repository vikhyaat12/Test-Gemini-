'use client';

import { useEffect } from 'react';

export function ReticleDev() {
  useEffect(() => {
    async function connectReticle() {
      try {
        const { reticle, install } = await import('@reticlehq/react');

        install();

        reticle.connect({
          projectId: 'next-app-0d1efa0f',
        });

        console.log('Reticle connected ✅');
      } catch (error) {
        console.error('Reticle connection failed ❌', error);
      }
    }

    connectReticle();
  }, []);

  return null;
}