'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Question {
  id: number;
  text: string;
  type: 'scale' | 'text' | 'multiple_choice';
  options?: string[];
  order: number;
}

interface Response {
  submission_id: string;
  question_id: number;
  response: string;
  instagram: string;
  phone_number: string;
  created_at: string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<{
    text: string;
    type: 'scale' | 'text' | 'multiple_choice';
    options: string[];
  }>({
    text: '',
    type: 'scale',
    options: [],
  });
  const [newOption, setNewOption] = useState('');
  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  const handleAddQuestion = async () => {
    if (!newQuestion.text) return;

    const { error } = await supabase.from('questions').insert({
      ...newQuestion,
      order: questions.length,
    });

    if (error) {
      alert('Error adding question');
      return;
    }

    fetchQuestions();
    setNewQuestion({ text: '', type: 'scale', options: [] });
  };

  const handleAddOption = () => {
    if (!newOption) return;
    setNewQuestion({
      ...newQuestion,
      options: [...(newQuestion.options || []), newOption],
    });
    setNewOption('');
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      // First check if there are any responses for this question
      const { data: responses } = await supabase
        .from('responses')
        .select('id')
        .eq('question_id', id);

      if (responses && responses.length > 0) {
        // Delete associated responses first
        const { error: responseError } = await supabase
          .from('responses')
          .delete()
          .eq('question_id', id);

        if (responseError) {
          console.error('Error deleting responses:', responseError);
          alert('Error deleting question responses');
          return;
        }
      }

      // Then delete the question
      const { error: questionError } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (questionError) {
        console.error('Error deleting question:', questionError);
        alert('Error deleting question');
        return;
      }

      // If successful, refresh the questions list
      await fetchQuestions();
    } catch (error) {
      console.error('Unexpected error deleting question:', error);
      alert('Unexpected error deleting question');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order in state
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));
    setQuestions(updatedItems);

    // Update order in database
    for (const item of updatedItems) {
      await supabase
        .from('questions')
        .update({ order: item.order })
        .eq('id', item.id);
    }
  };

  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert('Error fetching responses');
      return;
    }

    setResponses(data || []);
  };

  const getFilteredResponses = () => {
    if (!selectedQuestion) return responses;
    return responses.filter(r => r.question_id === selectedQuestion);
  };

  // Add this helper function to group responses
  const groupResponsesBySubmission = (responses: Response[]) => {
    const grouped = responses.reduce((acc, response) => {
      if (!acc[response.submission_id]) {
        acc[response.submission_id] = {
          responses: [],
          created_at: response.created_at,
          instagram: response.instagram,
          phone_number: response.phone_number
        };
      }
      acc[response.submission_id].responses.push(response);
      return acc;
    }, {} as Record<string, { 
      responses: Response[], 
      created_at: string,
      instagram: string,
      phone_number: string 
    }>);

    return Object.entries(grouped);
  };

  // Update the getSortedResponses function
  const getSortedResponses = () => {
    const filtered = getFilteredResponses();
    if (selectedQuestion) {
      // When filtering by question, just sort those responses
      if (questions.find(q => q.id === selectedQuestion)?.type === 'scale') {
        return filtered.sort((a, b) => {
          const numA = parseInt(a.response);
          const numB = parseInt(b.response);
          return sortOrder === 'desc' ? numB - numA : numA - numB;
        });
      }
      return filtered;
    }
    
    // When showing all, group by submission
    return groupResponsesBySubmission(filtered)
      .sort((a, b) => new Date(b[1].created_at).getTime() - new Date(a[1].created_at).getTime());
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-xl">
      <h1 className="mb-6 text-2xl font-bold text-center">Manage Questions</h1>

      {/* Toggle View */}
      <div className="mb-6 flex justify-center gap-4">
        <Button 
          variant={!showResponses ? "default" : "outline"}
          onClick={() => setShowResponses(false)}
        >
          Edit Questions
        </Button>
        <Button 
          variant={showResponses ? "default" : "outline"}
          onClick={() => {
            setShowResponses(true);
            fetchResponses();
          }}
        >
          View Responses
        </Button>
      </div>

      {showResponses ? (
        <div className="space-y-6">
          {/* Filter Controls */}
          <div className="flex gap-4 items-center">
            <select
              value={selectedQuestion || ''}
              onChange={(e) => setSelectedQuestion(e.target.value ? parseInt(e.target.value) : null)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">All Questions</option>
              {questions.map(q => (
                <option key={q.id} value={q.id}>{q.text}</option>
              ))}
            </select>
            
            {selectedQuestion && questions.find(q => q.id === selectedQuestion)?.type === 'scale' && (
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                Sort {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            )}
          </div>

          {/* Responses List */}
          <div className="space-y-6">
            {selectedQuestion ? (
              // Single question view
              <div className="space-y-4">
                {getSortedResponses().map((response, index) => {
                  const question = questions.find(q => q.id === response.question_id);
                  return (
                    <div key={index} className="p-4 border rounded">
                      <p className="font-medium">{question?.text}</p>
                      <p className="text-lg mt-2">{response.response}</p>
                      {response.instagram && (
                        <p className="text-sm text-gray-500 mt-1">Instagram: {response.instagram}</p>
                      )}
                      {response.phone_number && (
                        <p className="text-sm text-gray-500">Phone: {response.phone_number}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(response.created_at).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Grouped by submission view
              <div className="space-y-6">
                {getSortedResponses().map(([submissionId, submission]) => (
                  <div key={submissionId} className="border rounded-lg p-6 bg-gray-50">
                    <div className="mb-4 pb-2 border-b">
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(submission.created_at).toLocaleString()}
                      </p>
                      {submission.instagram && (
                        <p className="text-sm text-gray-500">Instagram: {submission.instagram}</p>
                      )}
                      {submission.phone_number && (
                        <p className="text-sm text-gray-500">Phone: {submission.phone_number}</p>
                      )}
                    </div>
                    <div className="space-y-4">
                      {submission.responses.map((response, index) => {
                        const question = questions.find(q => q.id === response.question_id);
                        return (
                          <div key={index} className="bg-white p-4 rounded border">
                            <p className="font-medium">{question?.text}</p>
                            <p className="text-lg mt-2">{response.response}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            <input
              type="text"
              value={newQuestion.text}
              onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
              placeholder="Question text"
              className="block w-full rounded-md border border-gray-300 px-3 py-2"
            />

            <select
              value={newQuestion.type}
              onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
              className="block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="scale">Scale (1-10)</option>
              <option value="text">Text Input</option>
              <option value="multiple_choice">Multiple Choice</option>
            </select>

            {newQuestion.type === 'multiple_choice' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  <Button onClick={handleAddOption}>Add</Button>
                </div>
                <div className="space-y-1">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>{option}</span>
                      <button
                        onClick={() => setNewQuestion({
                          ...newQuestion,
                          options: newQuestion.options.filter((_, i) => i !== index),
                        })}
                        className="text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleAddQuestion}>Add Question</Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {questions.map((question, index) => (
                    <Draggable
                      key={question.id}
                      draggableId={question.id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center justify-between p-4 border rounded bg-white"
                        >
                          <div>
                            <p className="font-medium">{question.text}</p>
                            <p className="text-sm text-gray-500">{question.type}</p>
                            {question.options && (
                              <div className="text-sm text-gray-500">
                                Options: {question.options.join(', ')}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion(question.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}
    </div>
  );
} 