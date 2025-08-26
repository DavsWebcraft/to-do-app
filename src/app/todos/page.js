"use client";

import { useState, useEffect } from "react";
import { todoApi } from "@/lib/api";
import TodoItem from "@/components/TodoItem";
import TodoForm from "@/components/TodoForm";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isHydrated, setIsHydrated] = useState(false);

  const fetchTodos = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await todoApi.getTodos(page, 10);
      setTodos(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (err) {
      setError("Failed to fetch todos");
      console.error("Error fetching todos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Filter todos based on active tab
  useEffect(() => {
    let filtered = [];

    switch (activeTab) {
      case "pending":
        filtered = todos.filter((todo) => !todo.completed);
        break;
      case "completed":
        filtered = todos.filter((todo) => todo.completed);
        break;
      default:
        filtered = todos;
    }

    setFilteredTodos(filtered);
  }, [todos, activeTab]);

  const handleCreateTodo = async (title) => {
    try {
      setCreating(true);
      await todoApi.createTodo({
        title,
        completed: false,
        userId: 1,
      });

      // Refresh the current page to show the new todo
      await fetchTodos(currentPage);
    } catch (err) {
      setError("Failed to create todo");
      console.error("Error creating todo:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleTodo = async (id, completed) => {
    try {
      await todoApi.updateTodo(id, { completed });
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? { ...todo, completed } : todo))
      );
    } catch (err) {
      setError("Failed to update todo");
      console.error("Error updating todo:", err);
    }
  };

  const handleUpdateTodo = async (id, title) => {
    try {
      await todoApi.updateTodo(id, { title });
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? { ...todo, title } : todo))
      );
    } catch (err) {
      setError("Failed to update todo");
      console.error("Error updating todo:", err);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await todoApi.deleteTodo(id);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));

      if (todos.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
        await fetchTodos(currentPage - 1);
      }
    } catch (err) {
      setError("Failed to delete todo");
      console.error("Error deleting todo:", err);
    }
  };

  const handlePageChange = (page) => {
    fetchTodos(page);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case "pending":
        return todos.filter((todo) => !todo.completed).length;
      case "completed":
        return todos.filter((todo) => todo.completed).length;
      default:
        return todos.length;
    }
  };

  if (loading && todos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading todos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Todo List</h1>
          <p className="text-gray-600">Manage your tasks efficiently</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <TodoForm onSubmit={handleCreateTodo} isLoading={creating} />

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                {
                  id: "all",
                  name: "All",
                  icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                },
                {
                  id: "pending",
                  name: "Pending",
                  icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  id: "completed",
                  name: "Completed",
                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <svg
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${
                        activeTab === tab.id
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }
                    `}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={tab.icon}
                    />
                  </svg>
                  {tab.name}
                  <span
                    className={`
                      ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium
                      ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-900"
                      }
                    `}
                  >
                    {getTabCount(tab.id)}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {activeTab === "all" && "No todos yet"}
                {activeTab === "pending" && "No pending todos"}
                {activeTab === "completed" && "No completed todos"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === "all" && "Get started by creating a new todo."}
                {activeTab === "pending" &&
                  "All your todos are completed! Great job!"}
                {activeTab === "completed" &&
                  "Complete some todos to see them here."}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
                onUpdate={handleUpdateTodo}
              />
            ))
          )}
        </div>

        {/* Only show pagination for "All" tab */}
        {activeTab === "all" && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
