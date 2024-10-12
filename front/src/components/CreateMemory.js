import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotographIcon, XIcon } from '@heroicons/react/solid';
import ScrollReveal from 'scrollreveal';

const CreateMemory = () => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [text, setText] = useState('');
    const [images, setImages] = useState([]);
    const navigate = useNavigate();

    const fieldsRef = useRef([]);

    useEffect(() => {
        // Appliquer les animations ScrollReveal à chaque champ
        fieldsRef.current.forEach((el, index) => {
            if (el) {
                ScrollReveal().reveal(el, {
                    delay: index * 100,
                    duration: 600,
                    easing: 'ease-in-out',
                    distance: '20px',
                    origin: 'bottom',
                    opacity: 0,
                    reset: false,
                });
            }
        });

        // Nettoyer les animations lors du démontage du composant
        return () => {
            ScrollReveal().destroy();
        };
    }, []);

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
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        const selectedProfileId = localStorage.getItem('selectedProfileId');
        console.log("selectedProfileId", selectedProfileId);
        if (!selectedProfileId) {
            console.error('No profile selected');
            return;
        }

        const newMemory = {
            owner: parseInt(selectedProfileId),
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
                            <h2 className="text-2xl font-semibold text-blue-800">Create New Memory</h2>
                            <button
                                onClick={() => navigate('/memories')}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            >
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4" ref={el => fieldsRef.current[1] = el}>
                                <label htmlFor="name" className="block text-sm font-medium text-blue-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-blue-300 rounded-md"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4" ref={el => fieldsRef.current[2] = el}>
                                <label htmlFor="location" className="block text-sm font-medium text-blue-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    id="location"
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-blue-300 rounded-md"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4" ref={el => fieldsRef.current[3] = el}>
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
                            <div className="mb-4" ref={el => fieldsRef.current[4] = el}>
                                <label htmlFor="text" className="block text-sm font-medium text-blue-700 mb-2">Text</label>
                                <textarea
                                    id="text"
                                    rows="4"
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border-blue-300 rounded-md p-2"
                                    placeholder="Describe your memory..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            <div className="mb-6" ref={el => fieldsRef.current[5] = el}>
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
                            <div className="flex justify-between" ref={el => fieldsRef.current[6] = el}>
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
