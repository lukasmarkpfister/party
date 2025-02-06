import { Instagram } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="rounded-lg bg-white p-8 shadow-xl max-w-md mx-auto mt-20 text-center space-y-6">
        <h1 className="text-3xl font-bold">Thank you! 🎉</h1>
        <p className="text-gray-600">
          Thank you for answering all the questions :) Maybe we'll each other again!
        </p>
        
        <div className="pt-4">
          <a
            href="https://instagram.com/thelukeview"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
          >
            <Instagram className="w-5 h-5" />
            <span>@thelukeview</span>
          </a>
        </div>
      </div>
    </main>
  );
} 