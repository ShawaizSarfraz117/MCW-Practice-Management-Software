import React from 'react';
import { Button } from '@mcw/ui';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">Welcome to Front Office</h1>
      <p className="text-xl mb-8">Client-facing application</p>
      <Button variant="default" size="lg">Get Started</Button>
    </main>
  );
} 