'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/Components/ui/button';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    console.log('user:', user);
    if (!user) {
      router.push('/signin'); 
    }
  }, [router]);

  return (
    <>
    <div className='flex justify-center mt-10'>
      <h1 className='text-4xl font-bold'>HoseJ</h1>
    </div>
    <div className='flex h-screen'>
      <Button className="m-auto"onClick={() => router.push('/dashboard/daily')}>Daily</Button>
    </div>
    <div className=' flex justify-center'>
      <Button variant={"secondary"}className="absolute bottom-20" onClick={() => router.push('/dashboard/create')}>Create Question</Button>
    </div> 
    </>
  );
}
