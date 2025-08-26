const API_BASE_URL = "https://jsonplaceholder.typicode.com";

// Local storage keys
const LOCAL_TODOS_KEY = "todo-app-local-todos";
const NEXT_ID_KEY = "todo-app-next-id";

// In-memory storage
let newTodos = [];
let nextId = 201;
let isInitialized = false;

// Helper functions for localStorage
const getLocalTodos = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOCAL_TODOS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return [];
  }
};

const setLocalTodos = (todos) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_TODOS_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
};

const getNextId = () => {
  if (typeof window === "undefined") return 201;
  try {
    const stored = localStorage.getItem(NEXT_ID_KEY);
    return stored ? parseInt(stored, 10) : 201;
  } catch (error) {
    console.error("Error reading next ID from localStorage:", error);
    return 201;
  }
};

const setNextId = (id) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NEXT_ID_KEY, id.toString());
  } catch (error) {
    console.error("Error writing next ID to localStorage:", error);
  }
};

// Initialize localStorage data
const initializeStorage = () => {
  if (typeof window !== "undefined" && !isInitialized) {
    newTodos = getLocalTodos();
    nextId = getNextId();
    isInitialized = true;
  }
};

export const todoApi = {
  // Fetch todos with pagination
  async getTodos(page = 1, limit = 10) {
    try {
      initializeStorage();

      const totalResponse = await fetch(`${API_BASE_URL}/todos`);
      const allExternalTodos = await totalResponse.json();
      const total = allExternalTodos.length + newTodos.length;

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const localTodosOnThisPage = newTodos.slice(startIndex, endIndex);

      const externalTodosNeeded = limit - localTodosOnThisPage.length;
      let externalTodos = [];

      if (externalTodosNeeded > 0) {
        // Calculate which external todos to fetch
        const localTodosCount = newTodos.length;
        const externalStartIndex = Math.max(0, startIndex - localTodosCount);
        const externalPage = Math.floor(externalStartIndex / limit) + 1;
        const externalOffset = externalStartIndex % limit;

        const response = await fetch(
          `${API_BASE_URL}/todos?_page=${externalPage}&_limit=${
            limit + externalOffset
          }`
        );
        const externalData = await response.json();
        externalTodos = externalData.slice(
          externalOffset,
          externalOffset + externalTodosNeeded
        );
      }

      const combinedTodos = [...localTodosOnThisPage, ...externalTodos];

      return {
        data: combinedTodos,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error fetching todos:", error);
      throw new Error("Failed to fetch todos");
    }
  },

  // Create a new todo
  async createTodo(todo) {
    try {
      initializeStorage();

      const newTodo = {
        id: nextId++,
        ...todo,
      };

      // Add to local storage at the beginning (top)
      newTodos.unshift(newTodo);

      // Save to localStorage
      setLocalTodos(newTodos);
      setNextId(nextId);

      return newTodo;
    } catch (error) {
      console.error("Error creating todo:", error);
      throw new Error("Failed to create todo");
    }
  },

  // Update an existing todo
  async updateTodo(id, updates) {
    try {
      initializeStorage();

      const localTodoIndex = newTodos.findIndex((todo) => todo.id === id);

      if (localTodoIndex !== -1) {
        // Update local todo
        newTodos[localTodoIndex] = { ...newTodos[localTodoIndex], ...updates };
        setLocalTodos(newTodos);
        return newTodos[localTodoIndex];
      } else {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error("Failed to update todo");
        }

        return await response.json();
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      throw new Error("Failed to update todo");
    }
  },

  // Delete a todo
  async deleteTodo(id) {
    try {
      initializeStorage();

      const localTodoIndex = newTodos.findIndex((todo) => todo.id === id);

      if (localTodoIndex !== -1) {
        // Remove from local storage
        newTodos.splice(localTodoIndex, 1);
        setLocalTodos(newTodos);
      } else {
        // Delete from external API (simulate)
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete todo");
        }
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      throw new Error("Failed to delete todo");
    }
  },

  // Get a single todo by ID
  async getTodoById(id) {
    try {
      initializeStorage();

      const localTodo = newTodos.find((todo) => todo.id === id);

      if (localTodo) {
        return localTodo;
      } else {
        // Fetch from external API
        const response = await fetch(`${API_BASE_URL}/todos/${id}`);

        if (!response.ok) {
          throw new Error("Todo not found");
        }

        return await response.json();
      }
    } catch (error) {
      console.error("Error fetching todo:", error);
      throw new Error("Failed to fetch todo");
    }
  },
};
