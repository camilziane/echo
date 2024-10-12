import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProfileSelection from './components/ProfileSelection';
import FamilyManagement from './components/FamilyManagement';
import Memory from './components/Memory';
import Memories from './components/Memories';
import Chatbot from './components/Chatbot';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<ProfileSelection />} />
          <Route path="/family" element={<FamilyManagement />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/memory/:id" element={<Memory/>} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
