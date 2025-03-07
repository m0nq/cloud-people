'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Root component with no SSR
const Root = dynamic(() => import('../src/main'), {
  ssr: false
});

export default function Page() {
  return <Root />;
}
