//chatController.js
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/userModel.js';
import Chat from '../models/chatModel.js';
import Plan from '../models/planModel.js';
import Expense from '../models/expenseModel.js';
import { generateContentWithFallback } from '../utils/gemini.js';
import { generateChatWithOpenAI } from '../utils/openaiFallback.js';
import { assertPlanAffordable, findSimilarPlan } from '../utils/planAffordability.js';
import {
  extractPlanFromConversation,
  userMessageSuggestsPlanCommit,
  userWantsSeparateNewPlan,
} from '../utils/planFromChat.js';

const PLAN_CATEGORIES = new Set([
  'general',
  'essentials',
  'savings',
  'entertainment',
  'shopping',
  'travel',
  'other',
]);

function normalizePlanDraft(d, saveIntentMessage = '') {
  if (!d || typeof d !== 'object') return null;
  const goal = String(d.goal || '').trim();
  const steps = Array.isArray(d.steps)
    ? d.steps.map((s) => String(s).trim()).filter(Boolean)
    : [];
  if (!goal || steps.length === 0) return null;

  let category = String(d.category || 'general').toLowerCase().trim();
  if (!PLAN_CATEGORIES.has(category)) category = 'general';

  let isFlex =
    d.commitmentMode === 'flexible' ||
    d.flexible === true ||
    String(d.commitmentMode || '').toLowerCase() === 'flexible';
  const hint = String(saveIntentMessage || '').toLowerCase();
  if (!isFlex && hint) {
    if (
      /\bflexible\b/.test(hint) ||
      /\bplaceholder\b/.test(hint) ||
      /\bfor\s+now\b/.test(hint) ||
      /\btbd\b/.test(hint) ||
      /\brough(ly)?\b/.test(hint)
    ) {
      isFlex = true;
    }
  }

  const commitmentMode = isFlex ? 'flexible' : 'budgeted';
  const horizonRaw = Number(d.horizonMonths);
  const horizonMonths = isFlex
    ? Math.max(1, horizonRaw > 0 ? horizonRaw : 12)
    : Math.max(3, horizonRaw || 12);

  return {
    goal,
    steps,
    category,
    estimatedMonthlyAmount: Math.max(0, Number(d.estimatedMonthlyAmount) || 0),
    horizonMonths,
    commitmentMode,
    flexible: isFlex,
  };
}

export const handleChat = async (req, res) => {
  try {
    const { prompt, user, imageData, sessionId, focusContext, planResolution } = req.body;

    if (!user?.uid) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user.uid'],
        received: { uid: user?.uid },
      });
    }

    const promptStr = prompt != null ? String(prompt).trim() : '';
    if (!planResolution && !promptStr) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['prompt or planResolution'],
        received: { prompt: !!promptStr },
      });
    }

    // Resolve "create new" / "update existing" after a similar-plan prompt (from UI buttons)
    if (planResolution?.action && promptStr) {
      const draft = normalizePlanDraft(planResolution.draft, promptStr);
      if (!draft) {
        return res.status(400).json({ error: 'Invalid plan draft in planResolution' });
      }

      let outText = '';
      let planCreated = false;
      let planUpdated = false;
      let savedPlan = null;

      if (planResolution.action === 'create_new') {
        const check = await assertPlanAffordable(user.uid, draft, null);
        if (!check.ok) {
          outText = `Could not add the plan: ${check.error}`;
          await Chat.create({
            uid: user.uid,
            message: promptStr,
            response: outText,
            sessionId: sessionId || 'default',
          });
          return res.json({
            response: outText,
            planBlocked: true,
            planDraft: draft,
          });
        }
        const newPlan = new Plan({
          uid: user.uid,
          goal: draft.goal,
          steps: draft.steps,
          category: draft.category,
          estimatedMonthlyAmount: draft.estimatedMonthlyAmount,
          horizonMonths: draft.horizonMonths,
          commitmentMode: draft.commitmentMode || 'budgeted',
        });
        savedPlan = await newPlan.save();
        await User.updateOne({ uid: user.uid }, { $addToSet: { goals: draft.goal } });
        planCreated = true;
        outText =
          draft.flexible
            ? `Done — I added a flexible plan: "${draft.goal}" (no strict budget check). Open My Plans to refine it anytime.`
            : `Done — I added a new plan: "${draft.goal}" with ${draft.steps.length} step(s). Open My Plans to see it.`;
      } else if (planResolution.action === 'update_existing') {
        const planId = planResolution.existingPlanId;
        if (!planId) {
          return res.status(400).json({ error: 'existingPlanId required for update_existing' });
        }
        const existing = await Plan.findOne({ _id: planId, uid: user.uid });
        if (!existing) {
          outText = 'That plan was not found. Try creating a new plan from My Plans.';
        } else {
          const check = await assertPlanAffordable(
            user.uid,
            {
              category: draft.category || existing.category,
              estimatedMonthlyAmount:
                draft.estimatedMonthlyAmount ?? existing.estimatedMonthlyAmount,
              horizonMonths: draft.horizonMonths ?? existing.horizonMonths,
              flexible: draft.flexible,
              commitmentMode: draft.commitmentMode,
            },
            planId
          );
          if (!check.ok) {
            outText = `Could not update the plan: ${check.error}`;
          } else {
            existing.goal = draft.goal;
            existing.steps = draft.steps;
            existing.category = draft.category || existing.category;
            existing.estimatedMonthlyAmount =
              draft.estimatedMonthlyAmount ?? existing.estimatedMonthlyAmount;
            existing.horizonMonths = draft.horizonMonths ?? existing.horizonMonths;
            if (draft.commitmentMode) existing.commitmentMode = draft.commitmentMode;
            savedPlan = await existing.save();
            await User.updateOne({ uid: user.uid }, { $addToSet: { goals: draft.goal } });
            planUpdated = true;
            outText = `Updated your plan "${savedPlan.goal}" with the new steps. Check My Plans for details.`;
          }
        }
      } else {
        return res.status(400).json({ error: 'Unknown planResolution.action' });
      }

      await Chat.create({
        uid: user.uid,
        message: promptStr,
        response: outText,
        sessionId: sessionId || 'default',
      });

      return res.json({
        response: outText,
        planCreated,
        planUpdated,
        plan: savedPlan,
        planDraft: null,
        planConflict: null,
      });
    }

    // 🔍 User, plans, spending — one connected picture for the assistant
    const userData = await User.findOne({ uid: user.uid });

    const takeHome = userData?.preferences?.budget != null ? Number(userData.preferences.budget) : null;
    const risk = userData?.preferences?.riskProfile || 'not set';

    const activePlans = await Plan.find({ uid: user.uid, completed: false })
      .sort({ updatedAt: -1 })
      .lean();

    const planLines =
      activePlans.length > 0
        ? activePlans
            .map(
              (p) =>
                `- ${p.goal} | category: ${p.category || 'general'} | ~₹${Number(p.estimatedMonthlyAmount) || 0}/mo | horizon: ${p.horizonMonths ?? 12} mo`
            )
            .join('\n')
        : '- (none — encourage a long-term plan in My Plans)';

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const recentExpenses = await Expense.find({
      uid: user.uid,
      date: { $gte: monthAgo },
    }).lean();
    const spent30 = recentExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const goalsLine = userData?.goals?.length
      ? `Goals list (profile + plans): ${userData.goals.join(', ')}.`
      : 'No goals in profile yet.';

    const sessionIdStr = sessionId != null ? String(sessionId) : '';
    const planThreadNote =
      sessionIdStr.startsWith('plan_') && sessionIdStr.length > 5
        ? '\nTHREAD: This conversation is the dedicated plan-coach thread for one goal only. Do not pivot to unrelated topics unless the user asks. Keep advice specific to this plan and its numbers.\n'
        : '';

    const focusBlock =
      focusContext && String(focusContext).trim()
        ? `\nCURRENT FOCUS (user opened chat from this — keep answers tied to it):\n${String(focusContext).trim()}\n`
        : '';

    const systemPrompt = `You are UpNext AI: a clear, practical assistant for personal finance, productivity, and general questions.

FINANCIAL SNAPSHOT (respect always; stay consistent with it):
- Monthly take-home in profile: ${takeHome != null && takeHome > 0 ? `₹${takeHome}` : 'NOT SET — ask them to add it in Profile for realistic advice'}
- Risk comfort: ${risk}
- Last ~30 days spending (from their expense log): ₹${Math.round(spent30)}
- Active long-term plans:
${planLines}
${focusBlock}${planThreadNote}
COACHING RULES:
- Tie suggestions to their existing plans and income. Do not encourage large entertainment, shopping, or travel spends that break their budget or existing plan commitments.
- If take-home is set and an idea is unrealistic, say so kindly and suggest a smaller step.
- New ideas should fit alongside current plans, not ignore them.
- When they settle on a plan with clear steps, you may invite them to say "add this plan to my plans" so it can be saved to My Plans automatically.
- If take-home income is not set or they want a rough placeholder, they can ask to add a "flexible" plan — the app can save it without strict budget caps until they refine numbers in My Plans.
- Do not claim a goal is already stored in My Plans unless you know the app saved it (the user will see a confirmation in the thread). If they ask to add to plans, help with details or invite the save phrase above — you cannot create the database entry yourself.
- Never say “I’ve added it to your plans” or “it’s saved in My Plans” in the same turn where you are still asking for confirmation or where the app may show a “similar plan” warning — only describe next steps unless the user already saw a clear Saved confirmation from the app.

HOW TO WRITE:
- Default: 1–3 short paragraphs unless they ask for detail.
- Hi/hello: 2–4 sentences + one focused follow-up; do not catalogue every capability.
- Bullets only for real steps or 3+ items. Plain text (no markdown ** or #).

SUBSTANCE:
- Specific and actionable. Money/tax/legal: educational only, not professional advice.
- If unsure, say so briefly.

CONTEXT FOR THIS USER:
${goalsLine}

USER MESSAGE:
${promptStr}`;

    // 🔍 Fetch chat context ONLY from the current session (if sessionId provided)
    let sessionChatsSorted = [];
    let chatContext = '';
    if (user?.uid && sessionId) {
      sessionChatsSorted = await Chat.find({
        uid: user.uid,
        sessionId: sessionId,
      }).sort({ createdAt: 1 });

      if (sessionChatsSorted.length > 0) {
        chatContext =
          '\n\nRECENT THREAD (newest at bottom):\n' +
          sessionChatsSorted
            .map((chat) => `User: ${chat.message}\nAssistant: ${chat.response}`)
            .join('\n---\n');
      }
    }

    const planThreadSnippet =
      sessionChatsSorted.length > 0
        ? sessionChatsSorted
            .map((chat) => `User: ${chat.message}\nAssistant: ${chat.response}`)
            .join('\n---\n')
            .slice(-8000)
        : '';

    const finalPrompt = systemPrompt + chatContext;

    let text;
    try {
      const result = await generateContentWithFallback({
        contents: [
          {
            role: 'user',
            parts: [{ text: finalPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.65,
          topP: 0.92,
          topK: 40,
          maxOutputTokens: 1200,
        },
      });
      const response = await result.response;
      text = response.text();
    } catch (geminiErr) {
      console.error('Gemini chain exhausted:', geminiErr.message || geminiErr);
      const openaiText = await generateChatWithOpenAI(finalPrompt);
      if (openaiText) {
        text = openaiText;
      } else {
        throw geminiErr;
      }
    }

    let finalText = text;
    let planDraft = null;
    let planConflict = null;
    let planCreated = false;
    let planBlocked = false;
    let createdPlanDoc = null;

    // Plan save is a second LLM call + DB writes — must never fail the main chat reply or skip persisting the message
    try {
      if (userMessageSuggestsPlanCommit(promptStr)) {
        const titles = activePlans.map((p) => p.goal);
        const rawDraft = await extractPlanFromConversation(
          promptStr,
          text,
          titles,
          planThreadSnippet
        );
        const extracted = rawDraft ? normalizePlanDraft(rawDraft, promptStr) : null;
        if (extracted) {
          const exact = activePlans.find(
            (p) =>
              !p.completed &&
              p.goal.trim().toLowerCase() === extracted.goal.trim().toLowerCase()
          );
          if (exact) {
            finalText = `${text}\n\n—\n"${extracted.goal}" is already in My Plans. Open Plans to view or edit it — no duplicate was created.`;
          } else {
            let similar = findSimilarPlan(activePlans, extracted.goal);
            const forceSeparate = userWantsSeparateNewPlan(promptStr);
            if (similar && forceSeparate) {
              const eg = String(similar.goal).toLowerCase().trim();
              const ng = String(extracted.goal).toLowerCase().trim();
              if (eg !== ng) similar = null;
            }
            if (similar) {
              planDraft = extracted;
              planConflict = {
                existingPlanId: String(similar._id),
                existingGoal: similar.goal,
              };
              finalText = `${text}\n\n—\nYou already have a similar plan: "${similar.goal}". Use the buttons below to update that plan or create a separate new one.`;
            } else {
              const check = await assertPlanAffordable(user.uid, extracted, null);
              if (!check.ok) {
                planDraft = extracted;
                planBlocked = true;
                finalText = `${text}\n\n—\nI understood you want this in My Plans, but it didn’t pass the budget check: ${check.error} You can adjust amounts in My Plans or your Profile take-home, or ask to add as a flexible plan.`;
              } else {
                const newPlan = new Plan({
                  uid: user.uid,
                  goal: extracted.goal,
                  steps: extracted.steps,
                  category: extracted.category,
                  estimatedMonthlyAmount: extracted.estimatedMonthlyAmount,
                  horizonMonths: extracted.horizonMonths,
                  commitmentMode: extracted.commitmentMode || 'budgeted',
                });
                createdPlanDoc = await newPlan.save();
                await User.updateOne({ uid: user.uid }, { $addToSet: { goals: extracted.goal } });
                planCreated = true;
                finalText = extracted.flexible
                  ? `${text}\n\n—\nSaved to My Plans (flexible): "${extracted.goal}" (${extracted.steps.length} steps). You can set amounts later in My Plans.`
                  : `${text}\n\n—\nSaved to My Plans: "${extracted.goal}" (${extracted.steps.length} steps).`;
              }
            }
          }
        }
      }
    } catch (planErr) {
      console.error('[handleChat] My Plans side-effect failed (reply still saved):', planErr?.message || planErr);
      finalText = text;
      planDraft = null;
      planConflict = null;
      planCreated = false;
      planBlocked = false;
      createdPlanDoc = null;
    }

    // 💾 Save the chat to the database WITH session ID
    if (user?.uid) {
      const newChat = new Chat({
        uid: user.uid,
        message: promptStr,
        response: finalText,
        sessionId: sessionId || 'default',
      });
      await newChat.save();
    }

    // 💾 Update user's past messages for context
    if (userData) {
      userData.pastMessages.push(promptStr);
      if (userData.pastMessages.length > 20) userData.pastMessages.shift();
      await userData.save();
    }

    res.json({
      response: finalText,
      planDraft,
      planConflict,
      planCreated,
      planBlocked,
      plan: createdPlanDoc || undefined,
    });
  } catch (error) {
    console.error('Chat Error:', error);

    const status = error.status ?? error.statusCode;
    const msg = (error.message || '').toLowerCase();

    // Handle specific Gemini API errors
    if (msg.includes('api key') || msg.includes('api_key')) {
      return res.status(500).json({ error: 'Invalid Gemini API key. Please check your configuration.' });
    }

    // 429 from SDK or quota wording in message
    if (
      status === 429 ||
      msg.includes('quota') ||
      msg.includes('resource exhausted') ||
      msg.includes('too many requests')
    ) {
      return res.status(429).json({
        error:
          'Google Gemini quota or rate limit reached for this project/model. Wait and retry, set GEMINI_MODEL in .env to another model (e.g. gemini-2.5-flash), or enable billing in Google AI Studio.',
        code: 'GEMINI_QUOTA',
      });
    }

    res.status(500).json({
      error: 'Chat request failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

export const saveChat = async (req, res) => {
  try {
    const { uid, message, response } = req.body;

    // Validate required fields
    if (!uid || !message || !response) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['uid', 'message', 'response'],
        received: { uid, message: !!message, response: !!response }
      });
    }

    const newChat = new Chat({
      uid,
      message: message.trim(),
      response: response.trim()
    });

    const savedChat = await newChat.save();
    
    res.status(201).json({
      message: "Chat saved successfully",
      chat: savedChat
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      error: 'Failed to save chat',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { uid, sessionId } = req.body; 
    
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required to fetch chat history.' });
    }
    
    // If sessionId is provided, fetch only that session's chats
    // If no sessionId, fetch all chats (for backward compatibility)
    const query = { uid };
    if (sessionId) {
      query.sessionId = sessionId;
    }
    
    // One session’s thread must be chronological for the UI; all-user list stays newest-first for grouping
    const sort = sessionId ? { createdAt: 1 } : { createdAt: -1 };
    const chats = await Chat.find(query).sort(sort);

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch chat history',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getChatsByUser = async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const chats = await Chat.find({ uid }).sort({ createdAt: -1 });
    
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch chats',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const updateChatSessionName = async (req, res) => {
  try {
    console.log('🔄 Update chat session name request:', req.body);
    const { uid, sessionId, customName } = req.body;
    
    if (!uid || !sessionId || !customName) {
      console.log('❌ Missing required fields:', { uid, sessionId, customName });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['uid', 'sessionId', 'customName'],
        received: { uid, sessionId, customName }
      });
    }

    console.log('🔍 Updating chats for session:', { uid, sessionId, customName });

    // Update all chats in the session with the new custom name
    const updateResult = await Chat.updateMany(
      { uid, sessionId },
      { customName: customName.trim() }
    );

    console.log('📊 Update result:', updateResult);

    if (updateResult.modifiedCount === 0) {
      console.log('⚠️ No chats found to update for session:', sessionId);
      return res.status(404).json({ 
        error: 'No chat session found to update',
        sessionId 
      });
    }

    console.log('✅ Successfully updated chat session name');
    res.status(200).json({
      message: "Chat session name updated successfully",
      sessionId,
      customName: customName.trim(),
      updatedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error updating chat session name:', error);
    res.status(500).json({ 
      error: 'Failed to update chat session name',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const deleteChatSession = async (req, res) => {
  try {
    const raw = req.method === 'GET' ? req.query : req.body;
    const uid = raw?.uid != null ? String(raw.uid).trim() : '';
    const sessionId = raw?.sessionId != null ? String(raw.sessionId).trim() : '';

    console.log('🔄 Delete chat session request:', { uid, sessionId, method: req.method });

    if (!uid || !sessionId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['uid', 'sessionId'],
        received: { uid: !!uid, sessionId: !!sessionId },
      });
    }

    const deleteResult = await Chat.deleteMany({ uid, sessionId });

    console.log('📊 Delete result:', deleteResult.deletedCount, 'for session', sessionId);

    // Idempotent: UI can clear even if DB was already empty or ids drifted
    res.status(200).json({
      message:
        deleteResult.deletedCount > 0
          ? 'Chat session deleted successfully'
          : 'No matching messages found (session may already be empty)',
      sessionId,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error('❌ Error deleting chat session:', error);
    res.status(500).json({
      error: 'Failed to delete chat session',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};





//old code: -------------------------------------------------------------------------------










// export const saveChat = async (req, res) => {
//   try {
//     const { uid, message, response } = req.body;

//     const newChat = new Chat({
//       uid,
//       message,
//       response
//     });

//     const savedChat = await newChat.save();
//     res.status(201).json({
//       message: "Chat saved",
//       chat: savedChat
//     });
//   } catch (error) {
//     console.error('Error saving chat:', error);
//     res.status(500).json({ error: 'Failed to save chat' });
//   }
// };

// export const getChatsByUser = async (req, res) => {
//   try {
//     const { uid } = req.params;
//     const chats = await Chat.find({ uid }).sort({ timestamp: -1 });
//     res.status(200).json(chats);
//   } catch (error) {
//     console.error('Error fetching chats:', error);
//     res.status(500).json({ error: 'Failed to fetch chats' });
//   }
// };





// export const handleChat = async (req, res) => {
//   try {
//     const { prompt, user } = req.body; // Accept prompt and user data
//     let personalizedPrompt = prompt;

//     // 🔍 Fetch user memory (goals & past messages)
//     const userData = await User.findOne({ uid: user.uid });

//     if (userData) {
//       if (userData.goals?.length) {
//         personalizedPrompt += `\nUser goals: ${userData.goals.join(', ')}.`;
//       }

//       if (userData.pastMessages?.length) {
//         const recentMessages = userData.pastMessages.slice(-3).join('\n');
//         personalizedPrompt += `\nPast messages:\n${recentMessages}`;
//       }
//     }

//     // 🧠 Gemini generates response
//     const result = await model.generateContent(personalizedPrompt);
//     const response = await result.response;
//     const text = response.text();


//     // 💾 Save latest prompt to memory
//     if (userData) {
//       userData.pastMessages.push(prompt);
//       if (userData.pastMessages.length > 20) userData.pastMessages.shift(); // Limit history
//       await userData.save();
//     }

//     res.json({ response: text });
//   } catch (error) {
//     console.error('Gemini Error:', error);
//     res.status(500).json({ error: 'Gemini API request failed.' });
//   }
// };



