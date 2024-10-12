import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotographIcon, XIcon } from '@heroicons/react/solid';
import { Button, CircularProgress, Typography } from "@mui/material";

const CreateMemory = () => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [text, setText] = useState('');
    const [images, setImages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('');

    const navigate = useNavigate();

    // Refs pour le MediaRecorder et les chunks audio
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    /**
     * Gère le téléchargement des images et les convertit en base64
     * @param {Event} event - L'événement de changement de fichier
     */
    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        })).then(base64Images => {
            setImages(prevImages => [...prevImages, ...base64Images]);
        }).catch(error => {
            console.error('Erreur lors du téléchargement des images:', error);
        });
    };

    /**
     * Gère la soumission du formulaire pour créer une nouvelle mémoire
     * @param {Event} event - L'événement de soumission du formulaire
     */
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        const selectedProfileId = localStorage.getItem('selectedProfileId');
        console.log("selectedProfileId", selectedProfileId);
        if (!selectedProfileId) {
            console.error('Aucun profil sélectionné');
            return;
        }

        const newMemory = {
            owner: parseInt(selectedProfileId, 10),
            name,
            location,
            date,
            images,
            text
        };

        try {
            const response = await fetch('http://localhost:8000/memories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMemory),
            });

            if (response.ok) {
                navigate('/memories');
            } else {
                console.error('Échec de la création de la mémoire');
            }
        } catch (error) {
            console.error('Erreur lors de la création de la mémoire:', error);
        }
    };

    /**
     * Bascule l'enregistrement audio
     */
    const toggleRecording = () => {
        if (isRecording) {
            if (mediaRecorderRef.current) {
                console.log("Arrêt de l'enregistrement...");
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
            setStatus("Enregistrement terminé, envoi en cours...");
        } else {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    mediaRecorderRef.current = new MediaRecorder(stream);
                    mediaRecorderRef.current.start();

                    console.log("Enregistrement démarré...");
                    setIsRecording(true);
                    setStatus("Enregistrement en cours...");

                    mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
                        audioChunksRef.current.push(event.data);
                        console.log("Données audio disponibles:", event.data);
                    });

                    mediaRecorderRef.current.addEventListener("stop", () => {
                        console.log("Enregistrement arrêté, envoi des données...");
                        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
                        sendAudioToServer(audioBlob);
                        audioChunksRef.current = [];
                    });
                })
                .catch((error) => {
                    console.error("Erreur lors de l'accès au microphone:", error);
                    setStatus("Erreur lors de l'accès au microphone.");
                });
        }
    };

    /**
     * Envoie l'audio enregistré au serveur pour transcription
     * @param {Blob} audioBlob - Le blob audio à envoyer
     */
    const sendAudioToServer = async (audioBlob) => {
        console.log("Envoi de l'audio au serveur...");
        const formData = new FormData();
        formData.append("audio", audioBlob, "enregistrement.mp3");

        try {
            console.log("Début de la requête de transcription...");
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort();
                console.log("Temps écoulé, arrêt de la requête.");
                setStatus("Erreur : temps écoulé lors de la transcription.");
            }, 10000); // Arrête la requête après 10 secondes

            const response = await fetch("http://localhost:8000/transcribe", {
                method: "POST",
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeout); // Annule le timeout si la réponse arrive avant
            console.log(`Réponse reçue du serveur. Statut: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Erreur HTTP! statut: ${response.status}, message: ${errorText}`);
                throw new Error(`Erreur HTTP! statut: ${response.status}`);
            }

            const data = await response.json();
            console.log("Données de transcription reçues:", data);

            if (data.error) {
                setStatus(`Erreur : ${data.error}`);
            } else {
                setText(data.transcription);
                setStatus("");
            }
        } catch (error) {
            console.error("Erreur lors de la transcription:", error);
            if (error.name === 'AbortError') {
                setStatus("Erreur : la requête a été annulée en raison d'un délai d'attente.");
            } else {
                setStatus(`Erreur : ${error.message}`);
            }
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center">
            <div className="max-w-3xl w-full mx-auto p-4">
                <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-blue-800">Créer une Nouvelle Mémoire</h2>
                            <button
                                onClick={() => navigate('/memories')}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            >
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium text-blue-700 mb-2">Nom</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-blue-300 rounded-md"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="location" className="block text-sm font-medium text-blue-700 mb-2">Lieu</label>
                                <input
                                    type="text"
                                    id="location"
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-blue-300 rounded-md"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="date" className="block text-sm font-medium text-blue-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    id="date"
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-blue-300 rounded-md"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="text" className="block text-sm font-medium text-blue-700 mb-2">Texte</label>
                                <div className="relative">
                                    <textarea
                                        id="text"
                                        rows="4"
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border-blue-300 rounded-md p-2"
                                        placeholder="Décrivez votre mémoire..."
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        required
                                    ></textarea>
                                    <button
                                        type="button"
                                        onClick={toggleRecording}
                                        className="absolute right-2 top-2 p-2 rounded-full bg-blue-600 text-white"
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-blue-700 mb-2">Télécharger des Images</label>
                                <div className="mt-1 flex items-center">
                                    <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-blue-300 rounded-md shadow-sm text-sm leading-4 font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        <PhotographIcon className="h-5 w-5 inline-block mr-2" />
                                        Choisir des fichiers
                                    </label>
                                    <input
                                        id="file-upload"
                                        name="file-upload"
                                        type="file"
                                        className="sr-only"
                                        multiple
                                        onChange={handleImageUpload}
                                    />
                                    <span className="ml-3 text-sm text-blue-500">
                                        {images.length} {images.length === 1 ? 'image' : 'images'} sélectionnée{images.length > 1 && 's'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/memories')}
                                    className="py-2 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Créer la Mémoire
                                </button>
                            </div>
                        </form>
                        {status && (
                            <div className="flex items-center justify-center mt-4">
                                <CircularProgress size={20} style={{ marginRight: "10px" }} />
                                <Typography variant="body1">{status}</Typography>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateMemory;
