import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  QuestionMarkCircleIcon, 
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/outline';
import { 
  HomeIcon as HomeIconSolid, 
  QuestionMarkCircleIcon as QuestionMarkCircleIconSolid, 
  PlusIcon as PlusIconSolid
} from '@heroicons/react/solid';
import ScrollReveal from 'scrollreveal';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    ScrollReveal().reveal('.sidebar-item', {
      delay: 200,
      distance: '20px',
      origin: 'left',
      duration: 800,
      easing: 'ease-out',
      interval: 100,
    });
  }, []);

  // Hide sidebar on create memory page
  if (location.pathname === '/create-memory') {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 h-full w-48 bg-white shadow-lg z-10">
      <div className="flex flex-col py-8 space-y-1">
        <div className="px-6 mb-6">
          {/* Appliquer la police Poppins à ce texte */}
          <div className="text-blue-800 font-bold text-3xl">Echo</div>
        </div>
        <Link to="/memories" className={`sidebar-item flex items-center space-x-4 px-6 py-3 ${isActive('/memories') ? 'text-blue-800 font-bold' : 'text-blue-600 hover:text-blue-800'}`}>
          {isActive('/memories') ? <HomeIconSolid className="h-6 w-6" /> : <HomeIcon className="h-6 w-6" />}
          <span className="text-sm">Home</span>
        </Link>
        <Link to="/chatbot" className={`sidebar-item flex items-center space-x-4 px-6 py-3 ${isActive('/chatbot') ? 'text-blue-800 font-bold' : 'text-blue-600 hover:text-blue-800'}`}>
          <SparklesIcon className="h-6 w-6" />
          <span className="text-sm">Recall</span>
        </Link>
        <Link to="/quiz-home" className={`sidebar-item flex items-center space-x-4 px-6 py-3 ${isActive('/quiz-home') ? 'text-blue-800 font-bold' : 'text-blue-600 hover:text-blue-800'}`}>
          {isActive('/quiz-home') ? <QuestionMarkCircleIconSolid className="h-6 w-6" /> : <QuestionMarkCircleIcon className="h-6 w-6" />}
          <span className="text-sm">Quiz</span>
        </Link>
        <Link to="/create-memory" className={`sidebar-item flex items-center space-x-4 px-6 py-3 ${isActive('/create-memory') ? 'text-blue-800 font-bold' : 'text-blue-600 hover:text-blue-800'}`}>
          {isActive('/create-memory') ? <PlusIconSolid className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
          <span className="text-sm">Create</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
