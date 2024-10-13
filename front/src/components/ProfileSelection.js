import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollReveal from 'scrollreveal';

const ProfileSelection = () => {
  const [profiles, setProfiles] = useState([]);
  const navigate = useNavigate();
  const title = "Choose your profile";
  const lettersRef = useRef([]);
  const profileCardsRef = useRef([]);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Fonction asynchrone pour récupérer les profils
    const fetchProfiles = async () => {
      try {
        const response = await fetch(`${API_URL}/profiles`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setProfiles(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des profils:', error);
        // Gérer l'erreur, par exemple en affichant un message à l'utilisateur
      }
    };
    fetchProfiles();

    // Animation douce pour les cartes de profils
    profileCardsRef.current.forEach((card, index) => {
      if (card) {
        ScrollReveal().reveal(card, {
          delay: 100,
          duration: 1500,
          easing: 'ease-in-out',
          opacity: 0,
          scale: 0.95,
          reset: true,
          viewFactor: 0.5,
        });
      }
    });

    // Animation lettre par lettre pour le titre
    lettersRef.current.forEach((letter, i) => {
      if (letter) {
        ScrollReveal().reveal(letter, {
          delay: i * 50, // décalage pour chaque lettre
          duration: 700,
          easing: 'ease-in-out',
          opacity: 0,
          reset: true,
        });
      }
    });

    // Fonction de nettoyage
    return () => {
      // Si nécessaire, nettoyer les animations ScrollReveal
      ScrollReveal().destroy();
    };
  }, []);

  const handleProfileClick = (profile) => {
    // Utilisation de navigate avec state au lieu de localStorage
    navigate('/memories', { state: { selectedProfileId: profile.id } });
  };

  const handleAddProfile = () => {
    navigate('/family');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-800 mb-8">
        {title.split('').map((char, index) => (
          <span
            key={index}
            className="title-letter inline-block"
            ref={el => lettersRef.current[index] = el}
          >
            {char === ' ' ? '\u00A0' : char} {/* espace insécable pour les espaces */}
          </span>
        ))}
      </h1>
      <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
        {profiles.map((profile, index) => (
          <button
            key={profile.id}
            className="group flex flex-col items-center focus:outline-none profile-card"
            onClick={() => handleProfileClick(profile)}
            ref={el => profileCardsRef.current[index] = el}
          >
            <div className="w-32 h-32 rounded-md overflow-hidden border-4 border-transparent group-hover:border-blue-500 transition-all duration-300">
              <img
                src={`${process.env.PUBLIC_URL}/logo.png`}
                alt={profile.name || 'Profile'}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="mt-2 text-blue-600 group-hover:text-blue-800 transition-colors duration-200">
              {profile.name}
            </span>
          </button>
        ))}
        <button
          className="group flex flex-col items-center focus:outline-none profile-card"
          onClick={handleAddProfile}
          ref={el => profileCardsRef.current[profiles.length] = el}
        >
          <div className="w-32 h-32 rounded-md overflow-hidden border-4 border-transparent group-hover:border-blue-500 transition-all duration-200 bg-blue-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 group-hover:text-blue-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Add Profile Icon">
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
