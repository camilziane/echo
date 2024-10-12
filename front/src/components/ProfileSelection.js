import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileSelection = () => {
  const [profiles, setProfiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/profiles')
      .then(response => response.json())
      .then(data => setProfiles(data));
  }, []);

  const handleProfileClick = (profile) => {
    localStorage.setItem('selectedProfileId', profile.id);
    navigate('/memories');
  };

  const handleAddProfile = () => {
    // navigate('/family');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-800 mb-8">Choose your profile</h1>
      <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
        {profiles.map(profile => (
          <button
            key={profile.id}
            className="group flex flex-col items-center focus:outline-none"
            onClick={() => handleProfileClick(profile)}
          >
            <div className="w-32 h-32 rounded-md overflow-hidden border-4 border-transparent group-hover:border-blue-500 transition-all duration-200">
              <img
                src={`${process.env.PUBLIC_URL}/logo.png`}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="mt-2 text-blue-600 group-hover:text-blue-800 transition-colors duration-200">
              {profile.name}
            </span>
          </button>
        ))}
        <button
          className="group flex flex-col items-center focus:outline-none"
          onClick={handleAddProfile}
        >
          <div className="w-32 h-32 rounded-md overflow-hidden border-4 border-transparent group-hover:border-blue-500 transition-all duration-200 bg-blue-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="mt-2 text-blue-600 group-hover:text-blue-800 transition-colors duration-200">
            Add Profile
          </span>
        </button>
      </div>
    </div>
  );
};

export default ProfileSelection;
