import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { 
  DotsVerticalIcon, 
  ChatAltIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/react/outline';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Sidebar from './Sidebar';
import ScrollReveal from 'scrollreveal';

function Memories() {
  const [memories, setMemories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [newComments, setNewComments] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const memoriesRef = useRef([]);

  useEffect(() => {
    const currentProfileId = localStorage.getItem('selectedProfileId');
    console.log("currentProfileId", currentProfileId);

    // Récupération des mémoires
    fetch('http://localhost:8000/memories')
      .then(response => response.json())
      .then(data => {
        // Trier les mémoires par id décroissant
        const sortedMemories = data.sort((a, b) => b.id - a.id);
        setMemories(sortedMemories);
      });

    // Récupération des profils
    fetch('http://localhost:8000/profiles')
      .then(response => response.json())
      .then(data => {
        setProfiles(data);
      })
      .catch(error => console.error('Erreur lors de la récupération des profils:', error));
  }, []);

  useEffect(() => {
    // Appliquer les animations ScrollReveal lorsque les mémoires sont chargées
    if (memoriesRef.current) {
      memoriesRef.current.forEach((el, index) => {
        if (el) {
          ScrollReveal().reveal(el, {
            delay: 0,
            duration: 800,
            easing: 'ease-in-out',
            opacity: 0,
            distance: '50px',
            reset: false,
            origin: 'bottom',
            viewFactor: 0.2, // Déclenche l'animation lorsque 20% de l'élément est visible
          });
        }
      });
    }

    // Fonction de nettoyage pour éviter les fuites de mémoire
    return () => {
      ScrollReveal().destroy();
    };
  }, [memories]);

  const handleCardClick = (memory) => {
    // navigate(`/memory/${memory.id}`, { state: { memory } });
  };

  const handleAddMemory = () => {
    navigate('/create-memory');
  };

  const isCreateMemoryPage = location.pathname === '/create-memory';

  const getProfileImage = (userId) => {
    const profile = profiles.find(p => p.id === userId);
    return profile && profile.image 
      ? `data:image/jpeg;base64,${profile.image}` 
      : `${process.env.PUBLIC_URL}/logo.png`;
  };

  const getNameForId = (userId) => {
    const profile = profiles.find(p => p.id === userId);
    return profile ? profile.name : 'Unknown User';
  };

  const handleAddComment = useCallback(async (memoryId, userId) => {
    const commentText = newComments[memoryId];
    if (!commentText) return;

    try {
      const response = await fetch(`http://localhost:8000/memories/${memoryId}/texts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: commentText,
          user_id: parseInt(userId),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const result = await response.json();

      // Update the local state with the new comment
      setMemories(prevMemories => 
        prevMemories.map(memory => 
          memory.id === memoryId
            ? {
                ...memory,
                texts: [
                  ...memory.texts,
                  { owner: parseInt(userId), id: result.id, text: commentText }
                ]
              }
            : memory
        )
      );

      // Clear the input field
      setNewComments(prev => ({ ...prev, [memoryId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [newComments]);

  return (
<div className="flex min-h-screen bg-gradient-to-b from-blue-100 to-white">
<Sidebar />

      {/* Contenu principal */}
      <div className={`flex-1 ${isCreateMemoryPage ? '' : 'ml-48'}`}>
        <div className="max-w-3xl mx-auto p-4">
          <div className="space-y-8 pt-4">
            {memories.map((memory, index) => (
              <div
                key={memory.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg cursor-pointer"
                ref={el => memoriesRef.current[index] = el}
                onClick={() => handleCardClick(memory)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <img
                        src={getProfileImage(memory.owner)}
                        alt={getNameForId(memory.owner)}
                        className="w-10 h-10 rounded-full mr-3 object-cover"
                      />
                      <div>
                        <span className="font-semibold text-blue-800">{memory.name}</span>
                        <p className="text-sm text-blue-600">{getNameForId(memory.owner)}</p>
                      </div>
                    </div>
                    <Menu as="div" className="relative">
                      <Menu.Button className="text-blue-400 hover:text-blue-600">
                        <DotsVerticalIcon className="h-5 w-5" />
                      </Menu.Button>
                      <Transition
                        enter="transition duration-100 ease-out"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition duration-75 ease-out"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                      >
                        <Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-white divide-y divide-blue-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="px-1 py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active ? 'bg-blue-100 text-blue-800' : 'text-blue-600'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                >
                                  Edit
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active ? 'bg-blue-100 text-blue-800' : 'text-blue-600'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                >
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
      
                  {/* Description ou texte sous le nom d'utilisateur */}
                  <p className="mt-2 text-blue-600">
                    {memory.texts && memory.texts.length > 0 && memory.texts[0].text}
                  </p>
                </div>
                {memory.images && memory.images.length > 1 ? (
                  <Carousel
                    showArrows={true}
                    showStatus={false}
                    showThumbs={false}
                    infiniteLoop={true}
                    renderArrowPrev={(onClickHandler, hasPrev, label) =>
                      hasPrev && (
                        <button type="button" onClick={onClickHandler} title={label} className="absolute left-4 top-1/2 z-10 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all duration-200">
                          <ChevronLeftIcon className="h-6 w-6 text-blue-800" />
                        </button>
                      )
                    }
                    renderArrowNext={(onClickHandler, hasNext, label) =>
                      hasNext && (
                        <button type="button" onClick={onClickHandler} title={label} className="absolute right-4 top-1/2 z-10 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all duration-200">
                          <ChevronRightIcon className="h-6 w-6 text-blue-800" />
                        </button>
                      )
                    }
                  >
                    {memory.images.map((image, idx) => (
                      <div key={idx}>
                        <img
                          src={`data:image/png;base64,${image}`}
                          alt={`${memory.name} - ${idx + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  memory.images && memory.images.length === 1 && (
                    <img
                      src={`data:image/png;base64,${memory.images[0]}`}
                      alt={memory.name}
                      className="w-full h-auto"
                    />
                  )
                )}
                <div className="p-4">
                  <p className="text-blue-400 text-sm mb-4">
                    {memory.date}
                  </p>
                  
                  {/* Section des commentaires */}
                  <div className="mt-4 space-y-3">
                    {memory.texts && memory.texts.slice(1).map((text) => (
                      <div key={text.id} className="flex items-start space-x-3">
                        <img
                          src={getProfileImage(text.owner)}
                          alt={getNameForId(text.owner)}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold text-blue-800">{getNameForId(text.owner)}</span>{' '}
                            <span className="text-blue-600">{text.text}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Champ d'ajout de commentaire */}
                  <div className="mt-4 flex items-center">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComments[memory.id] || ''}
                      onChange={(e) => setNewComments(prev => ({ ...prev, [memory.id]: e.target.value }))}
                      className="flex-1 border-none bg-gray-100 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      onClick={() => handleAddComment(memory.id, localStorage.getItem('selectedProfileId'))}
                      className="ml-2 text-blue-500 font-semibold"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Memories;
