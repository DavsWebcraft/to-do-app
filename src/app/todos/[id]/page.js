'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { todoApi } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function TodoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [error, setError] = useState(null);

  const todoId = Number(params.id);

  const fetchTodo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const todoData = await todoApi.getTodoById(todoId);
      setTodo(todoData);
      setEditTitle(todoData.title);
    } catch (err) {
      setError('Todo not found');
      console.error('Error fetching todo:', err);
    } finally {
      setLoading(false);
    }
  }, [todoId]);

  useEffect(() => {
    if (isNaN(todoId)) {
      setError('Invalid todo ID');
      setLoading(false);
      return;
    }

    fetchTodo();
  }, [fetchTodo]);

  const handleUpdate = async () => {
    if (!todo || !editTitle.trim()) return;

    try {
      setUpdating(true);
      await todoApi.updateTodo(todo.id, { title: editTitle.trim() });
      setTodo({ ...todo, title: editTitle.trim() });
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update todo');
      console.error('Error updating todo:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!todo) return;

    try {
      setUpdating(true);
      const updatedTodo = await todoApi.updateTodo(todo.id, { completed: !todo.completed });
      setTodo(updatedTodo);
    } catch (err) {
      setError('Failed to update todo');
      console.error('Error updating todo:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!todo) return;

    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
      setUpdating(true);
      await todoApi.deleteTodo(todo.id);
      router.push('/todos');
    } catch (err) {
      setError('Failed to delete todo');
      console.error('Error deleting todo:', err);
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading todo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !todo) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-md p-6">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-red-800">{error || 'Todo not found'}</h3>
              <div className="mt-4">
                <Link
                  href="/todos"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Back to Todos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/todos"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Todos
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Todo Details</h1>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  todo.completed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {todo.completed ? 'Completed' : 'Pending'}
                </span>
                <span className="text-sm text-gray-500">ID: {todo.id}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    disabled={updating}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdate}
                      disabled={updating || !editTitle.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditTitle(todo.title);
                      }}
                      disabled={updating}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className={`text-gray-900 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                    {todo.title}
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Edit todo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleToggleComplete}
                  disabled={updating}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    todo.completed
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {todo.completed ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    )}
                  </svg>
                  <span>{todo.completed ? 'Mark as Pending' : 'Mark as Completed'}</span>
                </button>
              </div>

              <button
                onClick={handleDelete}
                disabled={updating}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? 'Deleting...' : 'Delete Todo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
