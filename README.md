# UpNext AI - Your Personal AI Assistant 🤖

A beautiful, modern AI chatbot application built with React, Node.js, and Gemini AI. Features a stunning UI with professional design, past chat history, and seamless user experience.

## ✨ Features

### 🎨 Beautiful UI/UX
- **Modern Design**: Clean, professional interface with gradient themes
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion powered animations for delightful interactions
- **Glass Morphism**: Beautiful backdrop blur effects and transparency
- **Custom Scrollbars**: Elegant scrollbars with purple theme

### 💬 Chat Features
- **Real-time Chat**: Instant messaging with AI responses
- **Past Chat History**: View and manage your previous conversations
- **File Upload**: Support for PDF, DOC, DOCX, TXT, and image files
- **Typing Indicators**: Beautiful loading animations while AI thinks
- **Message Grouping**: Smart grouping of consecutive messages
- **Timestamp Display**: See when messages were sent

### 🚀 Enhanced Experience
- **Widget Mode**: Floating chatbot widget for quick access
- **Full-screen Mode**: Dedicated chat page for extended conversations
- **Welcome Screen**: Beautiful onboarding with feature highlights
- **Quick Suggestions**: Helpful prompts to get started
- **Error Handling**: Graceful error messages and fallbacks

### 🎯 AI Capabilities
- **Gemini AI Integration**: Powered by Google's latest AI model
- **Context Awareness**: Remembers conversation context
- **Personalized Responses**: Tailored to user preferences and goals
- **Multi-purpose**: Coding help, writing assistance, learning support, and more

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Production-ready motion library
- **Heroicons** - Beautiful hand-crafted SVG icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Google Gemini AI** - Advanced AI model

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd UpNext
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend (.env)
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   PORT=5000
   ```

4. **Start the application**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm start
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📱 Usage

### Widget Mode
- Click the floating purple button in the bottom-right corner
- Chat in a compact, elegant widget
- Access past chats with the chat history button
- Expand to full-screen mode for longer conversations

### Full-screen Mode
- Navigate to the dedicated chat page
- Enjoy a spacious, professional chat interface
- Use the enhanced input area with auto-resize
- Upload files and get AI assistance

### Features
- **Ask Anything**: Get help with coding, writing, learning, and more
- **File Upload**: Attach documents for AI analysis
- **Chat History**: View and manage past conversations
- **Responsive Design**: Works on all devices
- **Beautiful Animations**: Smooth, delightful interactions

## 🎨 Design Highlights

### Color Scheme
- **Primary**: Indigo to Purple gradients
- **Accent**: Pink highlights
- **Background**: Clean whites and subtle grays
- **Text**: Dark grays for readability

### Typography
- Modern, clean fonts
- Proper hierarchy and spacing
- Responsive text sizing

### Animations
- Smooth entrance animations
- Hover effects and transitions
- Loading states and indicators
- Message bubble animations

## 🔧 API Endpoints

### Chat
- `POST /api/chat` - Send message to AI
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/save` - Save chat to database

### Users
- `GET /api/users/:uid` - Get user data
- `POST /api/users` - Create user
- `PUT /api/users/:uid` - Update user

## 📁 Project Structure

```
UpNext/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   ├── ChatbotWidget.jsx
│   │   │   ├── LoadingDots.jsx
│   │   │   └── WelcomeMessage.jsx
│   │   ├── pages/
│   │   ├── styles/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🎯 Key Components

### ChatbotWidget
- Floating widget with beautiful animations
- Compact chat interface
- Past chats sidebar
- File upload support

### ChatUI
- Full-screen chat interface
- Message grouping and timestamps
- Enhanced input with auto-resize
- Professional loading states

### WelcomeMessage
- Beautiful onboarding experience
- Feature highlights
- Quick start suggestions
- Responsive design

## 🔮 Future Enhancements

- [ ] Voice input/output
- [ ] Code syntax highlighting
- [ ] Image generation
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Chat export functionality
- [ ] Advanced file processing
- [ ] User authentication
- [ ] Chat sharing
- [ ] AI model selection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini AI for powerful AI capabilities
- Framer Motion for beautiful animations
- Tailwind CSS for utility-first styling
- Heroicons for beautiful icons
- The React and Node.js communities

---

**Made with ❤️ and ☕ by the UpNext team** 