/* eslint-disable @typescript-eslint/no-explicit-any */
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

  useEffect(() => {
    fetchQuestions();
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found in questions page');
      } else {
        console.log('Session found in questions page:', session);
      }
    };
    checkAuth();
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

    setQuestions(data);
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
    const { error } = await supabase.from('questions').delete().eq('id', id);

    if (error) {
      alert('Error deleting question');
      return;
    }

    fetchQuestions();
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

  return (
    <div className="rounded-lg bg-white p-6 shadow-xl">
      <h1 className="mb-6 text-2xl font-bold text-center">Manage Questions</h1>

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
          <option value="scale">Scale (1-5)</option>
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
                        onClick={() => handleDeleteQuestion(question.id)}
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
    </div>
  );
} 