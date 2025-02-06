'use client';

import RatingForm from '@/components/RatingForm';

export default function Home() {
  return (
    <div>
      {/* Main Content */}
      <div className="rounded-lg bg-white p-6 shadow-xl max-w-2xl mx-auto mt-8">
        <h1 className="mb-6 text-2xl font-bold text-center">
          Rate Your Party Experience! 🎉
        </h1>
        
        <RatingForm />
      </div>
    </div>
  );
}
