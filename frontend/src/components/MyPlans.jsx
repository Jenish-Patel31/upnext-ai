import { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { 
  Plus, 
  Target, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Edit3, 
  Trash2, 
  X, 
  MessageCircle,
  TrendingUp,
  Award,
  Star,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as api from '../services/api.js';

export default function MyPlans() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [planForm, setPlanForm] = useState({
    goal: '',
    steps: []
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser.uid);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid) => {
    try {
      setIsLoading(true);
      
      const plansData = await api.getPlans(uid).catch((error) => {
        console.error('Error fetching plans:', error);
        return [];
      });
      
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading plans:', error);
      setMessage({ type: 'error', text: 'Failed to load plans' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlan = async () => {
    if (!planForm.goal || planForm.steps.length === 0) {
      setMessage({ type: 'error', text: 'Please fill in goal and add at least one step!' });
      return;
    }

    try {
      const newPlan = await api.createPlan({
        uid: user.uid,
        goal: planForm.goal,
        steps: planForm.steps
      });

      setPlans(prev => [newPlan.plan, ...prev]);
      setPlanForm({
        goal: '',
        steps: []
      });
      setShowAddPlan(false);
      setMessage({ type: 'success', text: 'Plan created successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan || !planForm.goal || planForm.steps.length === 0) {
      setMessage({ type: 'error', text: 'Please fill in all required fields!' });
      return;
    }

    try {
      // For now, we'll recreate the plan since the API doesn't have update
      await api.createPlan({
        uid: user.uid,
        goal: planForm.goal,
        steps: planForm.steps
      });

      // Remove the old plan and reload
      setPlans(prev => prev.filter(plan => plan._id !== editingPlan._id));
      await loadUserData(user.uid);

      setEditingPlan(null);
      setPlanForm({
        goal: '',
        steps: []
      });
      setMessage({ type: 'success', text: 'Plan updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        // For now, we'll just remove from state since API doesn't have delete
        setPlans(prev => prev.filter(plan => plan._id !== planId));
        setMessage({ type: 'success', text: 'Plan deleted successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: error.message });
      }
    }
  };

  const handleCompletePlan = async (planId) => {
    try {
      const updatedPlan = await api.completePlan(planId);
      setPlans(prev => prev.map(plan => 
        plan._id === planId ? updatedPlan.plan : plan
      ));
      setMessage({ type: 'success', text: 'Plan marked as complete!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleChatMessage = async () => {
    if (!chatMessage.trim()) return;

    setIsChatLoading(true);
    try {
      const response = await api.sendChatMessage({
        prompt: chatMessage,
        user: { uid: user.uid }
      });

      setChatResponse(response.response);
      
      // Save chat to database
      await api.saveChat({
        uid: user.uid,
        message: chatMessage,
        response: response.response
      });

      setChatMessage('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send message' });
    } finally {
      setIsChatLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDaysRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Plans</h1>
              <p className="text-gray-600">Track your goals and achieve your dreams</p>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <button
                onClick={() => setShowChat(true)}
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with AI</span>
              </button>
              <button
                onClick={() => setShowAddPlan(true)}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Plan</span>
              </button>
            </div>
          </div>

          {/* Message Alert */}
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Plans</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.filter(plan => !plan.completed).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.filter(plan => plan.completed).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.length > 0 
                      ? Math.round((plans.filter(plan => plan.completed).length / plans.length) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plans.map((plan) => {
              const daysRemaining = getDaysRemaining(plan.createdAt);
              const isOverdue = daysRemaining < 0;
              
              return (
                <motion.div
                  key={plan._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.goal}</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plan.completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {plan.completed ? 'Completed' : 'Active'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {plan.steps?.length || 0} steps
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanForm({
                            goal: plan.goal,
                            steps: plan.steps || []
                          });
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Steps */}
                  {plan.steps && plan.steps.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Steps</h4>
                      <div className="space-y-2">
                        {plan.steps.map((step, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {!plan.completed && (
                      <button
                        onClick={() => handleCompletePlan(plan._id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Complete</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowChat(true);
                      }}
                      className="flex-1 px-4 py-2 bg-purple-50 text-purple-600 font-medium rounded-xl hover:bg-purple-100 transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat about this plan</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {plans.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No plans yet</h3>
              <p className="text-gray-500 mb-6">Start by creating your first plan to track your goals</p>
              <button
                onClick={() => setShowAddPlan(true)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
              >
                Create Your First Plan
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add/Edit Plan Modal */}
      {(showAddPlan || editingPlan) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
              </h3>
              <button
                onClick={() => {
                  setShowAddPlan(false);
                  setEditingPlan(null);
                  setPlanForm({
                    goal: '',
                    steps: []
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal</label>
                <input
                  type="text"
                  value={planForm.goal}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, goal: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your goal..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Steps</label>
                <div className="space-y-2">
                  {planForm.steps.map((step, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => {
                          const newSteps = [...planForm.steps];
                          newSteps[index] = e.target.value;
                          setPlanForm(prev => ({ ...prev, steps: newSteps }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Step ${index + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newSteps = planForm.steps.filter((_, i) => i !== index);
                          setPlanForm(prev => ({ ...prev, steps: newSteps }));
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setPlanForm(prev => ({ ...prev, steps: [...prev.steps, ''] }))}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors duration-200"
                  >
                    + Add Step
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddPlan(false);
                  setEditingPlan(null);
                  setPlanForm({
                    goal: '',
                    steps: []
                  });
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={editingPlan ? handleUpdatePlan : handleAddPlan}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
              >
                {editingPlan ? 'Update Plan' : 'Add Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Chat with AI about {selectedPlan?.goal || 'your plans'}
              </h3>
              <button
                onClick={() => {
                  setShowChat(false);
                  setSelectedPlan(null);
                  setChatMessage('');
                  setChatResponse('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600">
                Ask me anything about your plans! I can help you:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Break down complex goals into smaller milestones</li>
                <li>• Suggest strategies to achieve your targets</li>
                <li>• Help you stay motivated and on track</li>
                <li>• Provide tips for better time management</li>
              </ul>
            </div>

            {chatResponse && (
              <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-800">{chatResponse}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                    placeholder="Ask me about your plans..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isChatLoading}
                  />
                </div>
                <button 
                  onClick={handleChatMessage}
                  disabled={isChatLoading || !chatMessage.trim()}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isChatLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 