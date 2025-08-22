import { auth } from '../firebase-config';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token from Firebase
const getAuthToken = () => {
  // Get the current user from Firebase auth
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return user.uid;
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  try {
    const uid = getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    // Add UID to the request body for POST requests
    if (options.body && options.method === 'POST') {
      const bodyData = JSON.parse(options.body);
      bodyData.uid = uid;
      config.body = JSON.stringify(bodyData);
    }

    // For GET requests, check if endpoint needs UID replacement
    let finalEndpoint = endpoint;
    if (endpoint.includes(':uid') && uid) {
      finalEndpoint = endpoint.replace(':uid', uid);
    }

    const response = await fetch(`${API_BASE_URL}${finalEndpoint}`, config);
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'API call failed');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// User APIs
export const createUser = async (userData) => {
  return apiCall('/users/create', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// Expense APIs
export const addExpense = async (expenseData) => {
  return apiCall('/expenses/add', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });
};

export const getExpenses = async (uid) => {
  return apiCall('/expenses/:uid');
};

export const deleteExpense = async (expenseId) => {
    try {
        const response = await apiCall(`/expenses/${expenseId}`, {
            method: 'DELETE'
        });
        return response;
    } catch (error) {
        throw new Error(error.message || 'Failed to delete expense');
    }
};

export const updateExpense = async (expenseId, expenseData) => {
    try {
        const response = await apiCall(`/expenses/${expenseId}`, {
            method: 'PUT',
            body: expenseData
        });
        return response;
    } catch (error) {
        throw new Error(error.message || 'Failed to update expense');
    }
};

// Category APIs
export const addCategory = async (categoryData) => {
  return apiCall('/categories/add', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
};

export const getCategories = async (uid) => {
  return apiCall('/categories/:uid');
};

export const deleteCategory = async (categoryId) => {
  try {
    const response = await apiCall(`/categories/${categoryId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete category');
  }
};

// Plan APIs
export const createPlan = async (planData) => {
  return apiCall('/plans/create', {
    method: 'POST',
    body: JSON.stringify(planData),
  });
};

export const getPlans = async (uid) => {
  return apiCall('/plans/:uid');
};

export const completePlan = async (planId) => {
  try {
    const response = await apiCall(`/plans/complete/${planId}`, {
      method: 'PATCH'
    });
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to complete plan');
  }
};

export const updatePlan = async (planId, planData) => {
  try {
    const response = await apiCall(`/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(planData)
    });
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to update plan');
  }
};

export const deletePlan = async (planId) => {
  try {
    const response = await apiCall(`/plans/${planId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete plan');
  }
};

// User APIs
export const getUser = async (uid) => {
  return apiCall('/users/:uid');
};

export const updateUser = async (uid, userData) => {
  try {
    const response = await apiCall(`/users/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to update user');
  }
};

export const deleteUser = async (uid) => {
  try {
    const response = await apiCall(`/users/${uid}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete user');
  }
};

// Chat APIs
export const sendChatMessage = async (messageData) => {
  return apiCall('/gemini', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
};

export const saveChat = async (chatData) => {
  return apiCall('/chats/save', {
    method: 'POST',
    body: JSON.stringify(chatData),
  });
};

export const getChats = async (uid) => {
  return apiCall(`/chats/${uid}`);
}; 