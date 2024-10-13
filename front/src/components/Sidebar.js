import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  QuestionMarkCircleIcon, 
  PlusIcon,
  BookOpenIcon,
  SparklesIcon,
  HeartIcon
} from '@heroicons/react/outline';
import { 
  HomeIcon as HomeIconSolid, 
  QuestionMarkCircleIcon as QuestionMarkCircleIconSolid, 
  PlusIcon as PlusIconSolid,
  HeartIcon as HeartIconSolid, 
  BookOpenIcon as BookOpenIconSolid
} from '@heroicons/react/solid';

const Sidebar = () => {
  const location = useLocation();
  const linksRef = useRef([]);

  const isActive = (path) => location.pathname === path;

  // Déterminer si la barre latérale doit être rendue
  const shouldRenderSidebar = location.pathname !== '/create-memory';

  if (!shouldRenderSidebar) {
    return null;
  }

  return (
<div className="fixed left-0 top-0 h-full w-48 bg-gradient-to-b from-blue-50 to-indigo-200 to-white shadow-lg z-10 backdrop-blur-md">
<div className="flex flex-col py-8 space-y-1">
        <div className="px-6 mb-6">
        <div className="text-blue-800 font-bold text-4xl font-poppins">
        <img src="echo_logo_f.svg" alt="Echo Logo"/>

</div>

          </div>
        <Link
          ref={el => linksRef.current[0] = el}
          to="/memories"
          className={`flex items-center space-x-4 px-6 py-3 ${isActive('/memories') ? 'text-blue-800 font-bold' : 'text-blue-600 hover:text-blue-800'}`}
        >
          {isActive('/memories') ? <BookOpenIconSolid className="h-6 w-6" /> : <BookOpenIcon className="h-6 w-6" />}
          <span className="text-sm">Library</span>
        </Link>
        <Link
          ref={el => linksRef.current[1] = el}
          to="/chatbot"
          className={`flex items-center space-x-4 px-6 py-3 ${isActive('/chatbot') ? 'text-blue-800 font-bold' : 'text-blue-600 hover:text-blue-800'}`}
        >
          <SparklesIcon className="h-6 w-6" />
          <span className="text-sm">Recall</span>
        </Link>
        <Link
          ref={el => linksRef.current[2] = el}
          to="/quiz-home"
          className={`flex items-center space-x-4 px-6 py-3 ${isActive('/quiz-home') ? 'text-blue-800 font-bold' : 'text-blue-600 hover:text-blue-800'}`}
        >
          {isActive('/quiz-home') ? <QuestionMarkCircleIconSolid className="h-6 w-6" /> : <QuestionMarkCircleIcon className="h-6 w-6" />}
          <span className="text-sm">Quiz</span>
        </Link>
        <Link
          ref={el => linksRef.current[3] = el}
          to="/create-memory"
          className={`flex items-center space-x-4 px-6 py-3 ${isActive('/create-memory') ? 'text-blue-800 font-bold' : 'text-blue-600 hover:text-blue-800'}`}
        >
          {isActive('/create-memory') ? <PlusIconSolid className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
          <span className="text-sm">New</span>
        </Link>
        <Link
          ref={el => linksRef.current[4] = el}
          to="/graph"
          className={`flex items-center space-x-4 px-6 py-3 ${isActive('/graph') ? 'text-blue-800 font-bold' : 'text-blue-600 hover:text-blue-800'}`}
        >
          {isActive('/graph') ? <HeartIconSolid className="h-6 w-6 text-blue-800" /> : <HeartIcon className="h-6 w-6 text-blue-800" />}
          <span className="text-sm text-blue-800">Recap Graph</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
