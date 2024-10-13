import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotographIcon, XIcon, MicrophoneIcon } from '@heroicons/react/solid';
import ScrollReveal from 'scrollreveal';
import { CircularProgress, Typography } from '@mui/material';

const CreateMemory = () => {
    const [text, setText] = useState('');
    const [images, setImages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("");

    const navigate = useNavigate();
    const fieldsRef = useRef([]);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        const sr = ScrollReveal({
            origin: 'bottom',
            distance: '20px',
            duration: 600,
            delay: 200,
            easing: 'ease-in-out',
            reset: false
        });

        fieldsRef.current.forEach((el, index) => {
            if (el) {
                sr.reveal(el, {
                    delay: index * 100
                });
            }
        });

        return () => sr.destroy();
    }, []);

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        setImages([...images, ...files]);
    };

    const toggleRecording = () => {
        if (isRecording) {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
        } else {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    mediaRecorderRef.current = new MediaRecorder(stream);
                    mediaRecorderRef.current.start();

                    setIsRecording(true);

                    mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
                        audioChunksRef.current.push(event.data);
                    });

                    mediaRecorderRef.current.addEventListener("stop", () => {
                        const audioBlob = new Blob(audioChunksRef.current, {
                            type: "audio/mp3",
                        });
                        sendAudioToServer(audioBlob);
                        audioChunksRef.current = [];
                    });
                })
                .catch((error) => {
                    console.error("Error accessing microphone:", error);
                    setStatus("Error accessing microphone.");
                });
        }
    };

    const sendAudioToServer = async (audioBlob) => {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.mp3");

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort();
                setStatus("Error: Timeout during transcription.");
            }, 10000); // Stop the request after 10 seconds

            const response = await fetch("http://localhost:8000/transcribe", {
                method: "POST",
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeout); // Cancel the timeout if the response arrives before

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                setStatus(`Error: ${data.error}`);
            } else {
                setText(data.transcription);
                setStatus("");
            }
        } catch (error) {
            console.error("Error during transcription:", error);
            if (error.name === "AbortError") {
                setStatus("Error: The request was aborted due to a timeout.");
            } else {
                setStatus(`Error: ${error.message}`);
            }
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        const selectedProfileId = localStorage.getItem('selectedProfileId');
        console.log("selectedProfileId", selectedProfileId);
        if (!selectedProfileId) {
            console.error('Aucun profil sélectionné');
            return;
        }

        // Create a data object instead of FormData
        const data = {
            owner: selectedProfileId,
            text: text
        };

        try {
            const response = await fetch('http://localhost:8000/memories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                navigate('/memories');
            } else {
                console.error('Failed to create memory');
            }
        } catch (error) {
            console.error('Error creating memory:', error);
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center">
            <div className="max-w-3xl w-full mx-auto p-4">
                <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6" ref={el => fieldsRef.current[0] = el}>
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
                                <label htmlFor="text" className="block text-sm font-medium text-blue-700 mb-2">Text</label>
                                <div className="flex items-center">
                                    <textarea
                                        id="text"
                                        rows="4"
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border-blue-300 rounded-md p-2"
                                        placeholder="Describe your memory..."
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                    ></textarea>
                                    <button
                                        type="button"
                                        onClick={toggleRecording}
                                        className={`ml-2 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            isRecording ? "bg-blue-200 text-blue-800" : "bg-white text-blue-600"
                                        }`}
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <MicrophoneIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                {status && (
                                    <div className="flex items-center justify-center mt-2">
                                        <CircularProgress size={20} style={{ marginRight: "10px" }} />
                                        <Typography variant="body1">{status}</Typography>
                                    </div>
                                )}
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-blue-700 mb-2">Upload Images</label>
                                <div className="mt-1 flex items-center">
                                    <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-blue-300 rounded-md shadow-sm text-sm leading-4 font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        <PhotographIcon className="h-5 w-5 inline-block mr-2" />
                                        Choose files
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
                                        {images.length} {images.length === 1 ? 'image' : 'images'} selected
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => navigate('/memories')}
                                    className="py-2 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Create Memory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateMemory;
