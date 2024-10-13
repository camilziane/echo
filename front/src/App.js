import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProfileSelection from './components/ProfileSelection';
import FamilyManagement from './components/FamilyManagement';
import Memories from './components/Memories';
import Chatbot from './components/Chatbot';
import CreateMemory from './components/CreateMemory';
import QuizPage from './components/QuizPage';
import QuizSlideshow from './components/QuizSlideShow';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<ProfileSelection />} />
          <Route path="/family" element={<FamilyManagement />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/create-memory" element={<CreateMemory />} />
          <Route path="/quiz-home" element={<QuizPage />} />
          <Route path="/quiz" element={<QuizSlideshow />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
