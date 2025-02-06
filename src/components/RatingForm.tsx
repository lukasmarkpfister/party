'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Question {
  id: number;
  text: string;
  type: 'scale' | 'text' | 'multiple_choice';
  options?: string[];
  order: number;
}

export default function RatingForm() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [contactInfo, setContactInfo] = useState({
    instagram: '',
    phoneNumber: '',
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('order');
    
    if (error) {
      alert('Error fetching questions');
      return;
    }

    setQuestions(data || []);
  };

  const handleResponse = async (response: string) => {
    const newResponses = {
      ...responses,
      [questions[currentQuestion].id]: response,
    };
    setResponses(newResponses);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setCurrentQuestion(questions.length); // Show contact info form
    }
  };

  if (questions.length === 0) {
    return <div>Loading...</div>;
  }

  if (currentQuestion >= questions.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Almost done! 🎉</h2>
        <p className="text-sm text-gray-500">Leave your contact info for updates (optional)</p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Instagram (optional)</label>
          <input
            type="text"
            value={contactInfo.instagram}
            onChange={(e) => setContactInfo({ ...contactInfo, instagram: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number (optional)</label>
          <input
            type="tel"
            value={contactInfo.phoneNumber}
            onChange={(e) => setContactInfo({ ...contactInfo, phoneNumber: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="pt-4">
          <Button 
            onClick={async () => {
              // Generate a unique submission ID
              const submission_id = crypto.randomUUID();

              const allResponses = Object.entries(responses).map(([questionId, response]) => ({
                submission_id,  // Add this to each response
                question_id: parseInt(questionId),
                response,
                instagram: contactInfo.instagram,
                phone_number: contactInfo.phoneNumber,
              }));

              const { error } = await supabase.from('responses').insert(allResponses);

              if (error) {
                console.error('Submission error:', error);
                alert('Error submitting responses');
                return;
              }

              // Redirect to thank you page instead of showing alert
              window.location.href = '/thank-you';
            }}
            className="w-full"
          >
            Send Feedback
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500 text-center">
        Question {currentQuestion + 1} of {questions.length}
      </div>

      <h2 className="text-xl font-semibold text-center">{currentQ.text}</h2>
      
      {currentQ.type === 'scale' && (
        <div className="flex flex-col gap-2">
          {/* First row: 1-5 */}
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <Button
                key={num}
                onClick={() => handleResponse(num.toString())}
                variant="outline"
                className="w-full h-16 text-xl"
              >
                {num}
              </Button>
            ))}
          </div>
          {/* Second row: 6-10 */}
          <div className="flex justify-between gap-2">
            {[6, 7, 8, 9, 10].map((num) => (
              <Button
                key={num}
                onClick={() => handleResponse(num.toString())}
                variant="outline"
                className="w-full h-16 text-xl"
              >
                {num}
              </Button>
            ))}
          </div>
        </div>
      )}

      {currentQ.type === 'text' && (
        <div className="space-y-2">
          <Textarea
            className="min-h-[100px]"
            placeholder="Type your answer here..."
            value={responses[currentQ.id] || ''}
            onChange={(e) => {
              setResponses({
                ...responses,
                [currentQ.id]: e.target.value
              });
            }}
          />
          <Button 
            onClick={() => handleResponse(responses[currentQ.id] || '')}
            className="w-full"
            disabled={!responses[currentQ.id]}
          >
            Next
          </Button>
        </div>
      )}

      {currentQ.type === 'multiple_choice' && currentQ.options && (
        <div className="space-y-2">
          {currentQ.options.map((option) => (
            <Button
              key={option}
              onClick={() => handleResponse(option)}
              variant="outline"
              className="w-full text-left justify-start h-auto py-4 px-6"
            >
              {option}
            </Button>
          ))}
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        {currentQ.type === 'scale' && 'Click a number to rate'}
        {currentQ.type === 'text' && 'Type your answer and click Next'}
        {currentQ.type === 'multiple_choice' && 'Click an option to select'}
      </div>
    </div>
  );
} 