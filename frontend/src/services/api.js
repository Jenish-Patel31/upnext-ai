import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const config = {
      url,
      method: options.method || 'GET',
      ...options,
    };

    // Handle body data properly
    if (options.body && typeof options.body === 'object') {
      config.data = options.body;
    } else if (options.body) {
      config.data = options.body;
    }

    const response = await api(config);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    if (error.response) {
      throw new Error(error.response.data?.error || error.response.data?.message || 'API request failed');
    } else if (error.request) {
      throw new Error('No response received from server');
    } else {
      throw new Error(error.message || 'Request failed');
    }
  }
};

// User APIs
export const createUser = async (userData) => {
  return apiCall('users/create', {
    method: 'POST',
    body: userData,
  });
};

export const getUser = async (uid) => {
  return apiCall(`users/${uid}`);
};

export const updateUser = async (uid, userData) => {
  return apiCall(`users/${uid}`, {
    method: 'PUT',
    body: userData,
  });
};

export const deleteUser = async (uid) => {
  return apiCall(`users/${uid}`, {
    method: 'DELETE',
  });
};

// Expense APIs
export const addExpense = async (expenseData) => {
  return apiCall('expenses/add', {
    method: 'POST',
    body: expenseData,
  });
};

export const getExpenses = async (uid) => {
  return apiCall(`expenses/${uid}`);
};

export const deleteExpense = async (expenseId) => {
  return apiCall(`expenses/${expenseId}`, {
    method: 'DELETE',
  });
};

export const updateExpense = async (expenseId, expenseData) => {
  return apiCall(`expenses/${expenseId}`, {
    method: 'PUT',
    body: expenseData,
  });
};

// Category APIs
export const addCategory = async (categoryData) => {
  return apiCall('categories/add', {
    method: 'POST',
    body: categoryData,
  });
};

export const getCategories = async (uid) => {
  return apiCall(`categories/${uid}`);
};

export const deleteCategory = async (categoryId) => {
  return apiCall(`categories/${categoryId}`, {
    method: 'DELETE',
  });
};

// Plan APIs
export const createPlan = async (planData) => {
  return apiCall('plans/create', {
    method: 'POST',
    body: planData,
  });
};

export const getPlans = async (uid) => {
  return apiCall(`plans/${uid}`);
};

export const completePlan = async (planId) => {
  return apiCall(`plans/complete/${planId}`, {
    method: 'PATCH',
  });
};

export const updatePlan = async (planId, planData) => {
  return apiCall(`plans/${planId}`, {
    method: 'PUT',
    body: planData,
  });
};

export const deletePlan = async (planId) => {
  return apiCall(`plans/${planId}`, {
    method: 'DELETE',
  });
};

// Chat APIs
export const sendChatMessage = async (messageData) => {
  return apiCall('chat', {
    method: 'POST',
    body: messageData,
  });
};

export const saveChat = async (chatData) => {
  return apiCall('chat/save', {
    method: 'POST',
    body: chatData,
  });
};

export const getChats = async (uid) => {
  return apiCall(`chat/${uid}`);
};

export const updateChatSessionName = async (uid, sessionId, customName) => {
  try {
    const response = await apiCall(`chat/session-name`, {
      method: 'PUT',
      body: { uid, sessionId, customName }
    });
    return response;
  } catch (error) {
    console.error('Failed to update chat session name:', error);
    throw error;
  }
};

export const deleteChatSession = async (uid, sessionId) => {
  try {
    const response = await apiCall(`chat/session`, {
      method: 'DELETE',
      body: { uid, sessionId }
    });
    return response;
  } catch (error) {
    console.error('Failed to delete chat session:', error);
    throw error;
  }
};

// Expense Parsing APIs
export const parseExpenseWithAI = async (text, categories, language) => {
  return apiCall('expense-parsing/parse', {
    method: 'POST',
    body: {
      text,
      categories,
      language,
      userId: 'user-' + Date.now(), // Generate unique user ID for testing
    },
  });
};

export const getParsingStats = async (uid) => {
  return apiCall(`expense-parsing/stats/${uid}`);
};

export const getSupportedLanguages = async () => {
  return apiCall('expense-parsing/languages');
}; 