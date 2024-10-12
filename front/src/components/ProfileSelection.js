import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Remplace useHistory par useNavigate

const ProfileSelection = () => {
  const [profiles, setProfiles] = useState([]);
  const navigate = useNavigate(); // Utilise useNavigate pour la redirection

  // Fonction pour récupérer les profils depuis le backend FastAPI
  const fetchProfiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/profiles');
      const data = await response.json();
      setProfiles(data); // Met à jour l'état avec les données des profils
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  // Utilise useEffect pour appeler fetchProfiles lorsque le composant est monté
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Fonction appelée lors du clic sur un profil
  const handleProfileClick = (profile) => {
    // Stocker l'ID du profil dans localStorage
    localStorage.setItem('selectedProfileId', profile.id);
    
    // Rediriger vers la page "Memories" en utilisant navigate
    navigate('/memories');
  };

  return (
    <div className="profile-selection-page">
      <h2>Select a Profile</h2>
      <div className="profile-list">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className="profile-item"
            onClick={() => handleProfileClick(profile)} // Gestionnaire de clic
            style={{
              cursor: 'pointer', // Ajouter un pointeur pour indiquer que c'est cliquable
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              margin: '10px',
            }}
          >
            <img
              src={`data:image/png;base64,${profile.image}`} // Afficher l'image encodée en Base64
              alt={profile.name}
              className="profile-image"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            <p>{profile.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSelection;
