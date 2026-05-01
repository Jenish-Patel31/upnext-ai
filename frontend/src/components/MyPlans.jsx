import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { auth } from '../firebase-config';
import ChatUI from './Chat/ChatUI.jsx';
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
  Star
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
  const [chatFocus, setChatFocus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [planForm, setPlanForm] = useState({
    goal: '',
    steps: [],
    category: 'general',
    estimatedMonthlyAmount: '',
    horizonMonths: '12',
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

  useEffect(() => {
    const refresh = () => {
      if (user?.uid) loadUserData(user.uid, { silent: true });
    };
    window.addEventListener('upnext-plans-changed', refresh);
    return () => window.removeEventListener('upnext-plans-changed', refresh);
  }, [user?.uid]);

  /** Plan-coach modal: keep scoped plan + AI focus text in sync after silent list refresh (e.g. chat saved a plan). */
  useEffect(() => {
    if (!showChat || !selectedPlan?._id) return;
    const id = String(selectedPlan._id);
    const fresh = plans.find((p) => String(p._id) === id);
    if (!fresh) return;
    setSelectedPlan(fresh);
    setChatFocus(
      `Plan focus — Goal: "${fresh.goal}". Category: ${fresh.category || 'general'}. Commitment: ${fresh.commitmentMode === 'flexible' ? 'flexible (placeholder OK)' : 'budgeted'}. About ₹${Number(fresh.estimatedMonthlyAmount) || 0}/month for ${fresh.horizonMonths ?? 12} months. Steps: ${(fresh.steps || []).join(' → ') || 'none'}.`
    );
  }, [plans, showChat, selectedPlan?._id]);

  /** silent: refresh plans without full-page spinner (keeps ChatUI mounted while chatting). */
  const loadUserData = async (uid, { silent = false } = {}) => {
    try {
      if (!silent) setIsLoading(true);

      const plansData = await api.getPlans(uid).catch((error) => {
        console.error('Error fetching plans:', error);
        return [];
      });

      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error('Error loading plans:', error);
      setMessage({ type: 'error', text: 'Failed to load plans' });
    } finally {
      if (!silent) setIsLoading(false);
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
        steps: planForm.steps.filter((s) => String(s).trim()),
        category: planForm.category,
        estimatedMonthlyAmount: planForm.estimatedMonthlyAmount
          ? Number(planForm.estimatedMonthlyAmount)
          : 0,
        horizonMonths: planForm.horizonMonths ? Number(planForm.horizonMonths) : 12,
      });

      setPlans((prev) => [newPlan.plan, ...prev]);
      setPlanForm({
        goal: '',
        steps: [],
        category: 'general',
        estimatedMonthlyAmount: '',
        horizonMonths: '12',
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
      await api.updatePlan(editingPlan._id, {
        goal: planForm.goal,
        steps: planForm.steps.filter((s) => String(s).trim()),
        category: planForm.category,
        estimatedMonthlyAmount: planForm.estimatedMonthlyAmount
          ? Number(planForm.estimatedMonthlyAmount)
          : 0,
        horizonMonths: planForm.horizonMonths ? Number(planForm.horizonMonths) : 12,
      });

      await loadUserData(user.uid, { silent: true });

      setEditingPlan(null);
      setShowAddPlan(false);
      setPlanForm({
        goal: '',
        steps: [],
        category: 'general',
        estimatedMonthlyAmount: '',
        horizonMonths: '12',
      });
      setMessage({ type: 'success', text: 'Plan updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.deletePlan(planId);
      await loadUserData(user.uid, { silent: true });
      setMessage({ type: 'success', text: 'Plan deleted successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Delete failed' });
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

  const closePlanEditor = () => {
    setShowAddPlan(false);
    setEditingPlan(null);
    setPlanForm({
      goal: '',
      steps: [],
      category: 'general',
      estimatedMonthlyAmount: '',
      horizonMonths: '12',
    });
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
                type="button"
                onClick={() => {
                  setSelectedPlan(null);
                  setChatFocus(
                    'User is on My Plans. Help with long-term planning that fits their take-home and active plans already on file.'
                  );
                  setShowChat(true);
                }}
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                          {plan.category || 'general'}
                        </span>
                        {plan.commitmentMode === 'flexible' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200">
                            Flexible commitment
                          </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900">
                          ~₹{Number(plan.estimatedMonthlyAmount) || 0}/mo
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {plan.horizonMonths ?? 12} mo horizon
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
                            steps: plan.steps?.length ? plan.steps : [''],
                            category: plan.category || 'general',
                            estimatedMonthlyAmount:
                              plan.estimatedMonthlyAmount != null
                                ? String(plan.estimatedMonthlyAmount)
                                : '',
                            horizonMonths: String(plan.horizonMonths ?? 12),
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
                      type="button"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setChatFocus(
                          `Plan focus — Goal: "${plan.goal}". Category: ${plan.category || 'general'}. Commitment: ${plan.commitmentMode === 'flexible' ? 'flexible (placeholder OK)' : 'budgeted'}. About ₹${Number(plan.estimatedMonthlyAmount) || 0}/month for ${plan.horizonMonths ?? 12} months. Steps: ${(plan.steps || []).join(' → ') || 'none'}.`
                        );
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

      {/* Add/Edit Plan — portaled so it sits above nav / transforms */}
      {(showAddPlan || editingPlan) &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[280]"
            onClick={(e) => {
              if (e.target === e.currentTarget) closePlanEditor();
            }}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative z-[281]"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
              </h3>
              <button
                type="button"
                onClick={closePlanEditor}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Plans are long-term (3+ months). Set monthly take-home in Profile so we can keep entertainment / travel / shopping plans realistic.
            </p>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={planForm.category}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="general">General</option>
                    <option value="essentials">Essentials</option>
                    <option value="savings">Savings / invest</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="shopping">Shopping</option>
                    <option value="travel">Travel</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horizon (months)</label>
                  <input
                    type="number"
                    min={3}
                    value={planForm.horizonMonths}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, horizonMonths: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Est. monthly amount (₹) — optional, for budget checks
                </label>
                <input
                  type="number"
                  min={0}
                  value={planForm.estimatedMonthlyAmount}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, estimatedMonthlyAmount: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
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
                        type="button"
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
                    type="button"
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
                type="button"
                onClick={closePlanEditor}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={editingPlan ? handleUpdatePlan : handleAddPlan}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
              >
                {editingPlan ? 'Update Plan' : 'Add Plan'}
              </button>
            </div>
          </div>
        </div>,
          document.body
        )}

      {user && (
        <ChatUI
          key={selectedPlan?._id ? `plan-${selectedPlan._id}` : 'general'}
          isOpen={showChat}
          onClose={() => {
            setShowChat(false);
            setSelectedPlan(null);
            setChatFocus('');
            if (user?.uid) loadUserData(user.uid, { silent: true });
          }}
          user={user}
          focusContext={chatFocus}
          scopedPlan={selectedPlan}
          onPlansMutated={() => user?.uid && loadUserData(user.uid, { silent: true })}
        />
      )}
    </div>
  );
} 