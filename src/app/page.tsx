'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');

    if (!user) {
      router.push('/signin'); 
    }
  }, [router]);

  return (
    <>
      <h1>HoseJ</h1>
    </>
  );
}
