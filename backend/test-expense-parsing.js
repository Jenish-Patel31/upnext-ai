// test-expense-parsing.js - Test the advanced expense parsing service
import { parseExpenseWithAI } from './services/expenseParsingService.js';
import dotenv from 'dotenv';

dotenv.config();

const testCases = [
  {
    text: "I spent 500 rupees on lunch today",
    language: "en",
    categories: ["Food", "Transport", "Shopping", "Entertainment", "Health", "Education", "Bills", "Groceries"],
    expected: { amount: 500, category: "Food" }
  },
  {
    text: "मैंने दोपहर के खाने पर 500 रुपये खर्च किए",
    language: "hi",
    categories: ["Food", "Transport", "Shopping", "Entertainment", "Health", "Education", "Bills", "Groceries"],
    expected: { amount: 500, category: "Food" }
  },
  {
    text: "मी दुपारच्या जेवणावर 500 रुपये खर्च केले",
    language: "mr",
    categories: ["Food", "Transport", "Shopping", "Entertainment", "Health", "Education", "Bills", "Groceries"],
    expected: { amount: 500, category: "Food" }
  },
  {
    text: "હું બપોરના ભોજન પર 500 રૂપિયા ખર્ચ કર્યા",
    language: "gu",
    categories: ["Food", "Transport", "Shopping", "Entertainment", "Health", "Education", "Bills", "Groceries"],
    expected: { amount: 500, category: "Food" }
  },
  {
    text: "நான் மதிய உணவுக்கு 500 ரூபாய் செலவழித்தேன்",
    language: "ta",
    categories: ["Food", "Transport", "Shopping", "Entertainment", "Health", "Education", "Bills", "Groceries"],
    expected: { amount: 500, category: "Food" }
  },
  {
    text: "నేను మధ్యాహ్న భోజనానికి 500 రూపాయలు ఖర్చు చేశాను",
    language: "te",
    categories: ["Food", "Transport", "Shopping", "Entertainment", "Health", "Education", "Bills", "Groceries"],
    expected: { amount: 500, category: "Food" }
  },
  {
    text: "আমি দুপুরের খাবারের জন্য ৫০০ টাকা খরচ করেছি",
    language: "bn",
    categories: ["Food", "Transport", "Shopping", "Entertainment", "Health", "Education", "Bills", "Groceries"],
    expected: { amount: 500, category: "Food" }
  },
  {
    text: "ਮੈਂ ਦੁਪਹਿਰ ਦੇ ਖਾਣੇ ਲਈ 500 ਰੁਪਏ ਖਰਚ ਕੀਤੇ",
    language: "pa",
    categories: ["Food", "Transport", "Shopping", "Entertainment", "Health", "Education", "Bills", "Groceries"],
    expected: { amount: 500, category: "Food" }
  }
];

async function testExpenseParsing() {
  console.log('🧠 Testing Advanced Expense Parsing Service...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📝 Test ${i + 1}: ${testCase.language.toUpperCase()} - "${testCase.text}"`);
    
    try {
      const result = await parseExpenseWithAI(testCase.text, testCase.categories, testCase.language);
      
      // Check if amount matches
      const amountMatch = result.amount === testCase.expected.amount;
      const categoryMatch = result.category === testCase.expected.category;
      
      if (amountMatch && categoryMatch) {
        console.log(`✅ PASSED - Amount: ${result.amount}, Category: ${result.category}, Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        passedTests++;
      } else {
        console.log(`❌ FAILED - Expected: Amount ${testCase.expected.amount}, Category ${testCase.expected.category}`);
        console.log(`   Got: Amount ${result.amount}, Category ${result.category}`);
      }
      
      console.log(`   Language: ${result.language}, Accuracy: ${(result.accuracy * 100).toFixed(1)}%\n`);
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}\n`);
    }
  }
  
  console.log(`🎯 Test Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The AI parsing service is working perfectly!');
  } else {
    console.log('⚠️ Some tests failed. Check the implementation.');
  }
}

// Run the tests
testExpenseParsing().catch(console.error);
