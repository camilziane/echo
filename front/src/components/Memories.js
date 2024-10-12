import React, { useState, useEffect } from 'react';
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

function Memories() {
  const [memories, setMemories] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch('http://localhost:8000/memories')
      .then(response => response.json())
      .then(data => setMemories(data));
  }, []);

  const handleCardClick = (memory) => {
    navigate(`/memory/${memory.id}`, { state: { memory } });
  };

  const handleAddMemory = () => {
    navigate('/create-memory');
  };

  const isCreateMemoryPage = location.pathname === '/create-memory';

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <Sidebar />

      {/* Main content */}
      <div className={`flex-1 ${isCreateMemoryPage ? '' : 'ml-48'}`}>
        <div className="max-w-3xl mx-auto p-4">
          <div className="space-y-8 pt-4">
            {memories.map((memory) => (
              <div key={memory.id} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={`${process.env.PUBLIC_URL}/logo.png`}
                      alt={memory.userName}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <span className="font-semibold text-blue-800">{memory.userName}</span>
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
                {memory.images && memory.images.length > 1 ? (
                  <Carousel
                    showArrows={true}
                    showStatus={false}
                    showThumbs={false}
                    infiniteLoop={true}
                    renderArrowPrev={(onClickHandler, hasPrev, label) =>
                      hasPrev && (
                        <button type="button" onClick={onClickHandler} title={label} className="absolute left-0 top-1/2 z-10 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all duration-200">
                          <ChevronLeftIcon className="h-6 w-6 text-blue-800" />
                        </button>
                      )
                    }
                    renderArrowNext={(onClickHandler, hasNext, label) =>
                      hasNext && (
                        <button type="button" onClick={onClickHandler} title={label} className="absolute right-0 top-1/2 z-10 bg-white bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all duration-200">
                          <ChevronRightIcon className="h-6 w-6 text-blue-800" />
                        </button>
                      )
                    }
                  >
                    {memory.images.map((image, index) => (
                      <div key={index}>
                        <img
                          src={`data:image/png;base64,${image}`}
                          alt={`${memory.name} - ${index + 1}`}
                          className="w-full h-auto cursor-pointer"
                          onClick={() => handleCardClick(memory)}
                        />
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <img
                    src={`data:image/png;base64,${memory.images?.[0] || memory.image}`}
                    alt={memory.name}
                    className="w-full h-auto cursor-pointer"
                    onClick={() => handleCardClick(memory)}
                  />
                )}
                <div className="p-4">
                  <p className="mb-2">
                    <span className="font-semibold text-blue-800">{memory.userName}</span>{' '}
                    <span className="text-blue-600">{memory.caption}</span>
                  </p>
                  <p className="text-blue-400 text-sm">
                    {memory.location} • {memory.start_date} - {memory.end_date}
                  </p>
                  <div className="mt-4 flex items-center">
                    <button className="text-blue-400 hover:text-blue-600 transition-colors duration-200 flex items-center">
                      <ChatAltIcon className="h-6 w-6 mr-2" />
                      <span>Comment</span>
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
