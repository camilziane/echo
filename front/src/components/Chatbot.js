import React, { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/solid';
import Sidebar from './Sidebar';
import { RemoteRunnable } from "@langchain/core/runnables/remote";

// Création d'une instance RemoteRunnable pour communiquer avec le serveur LangServe
const chain = new RemoteRunnable({ url: "http://localhost:8001/rag/c/N4XyA/" });

const Chatbot = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = async () => {
        if (input.trim() === '') return;

        const userMessage = { role: 'human', content: input };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setInput('');

        try {
            // Invocation de la chaîne LangServe avec l'historique des messages
            const response = await chain.invoke({
                messages: messages.concat(userMessage)
            });

            console.log('Réponse reçue:', response.content);

            // Vérification de la structure de la réponse avant d'accéder à la propriété 'answer'
            const botResponse = response && response.output ? response.output : "Désolé, je n'ai pas pu générer une réponse appropriée.";

            // Ajout de la réponse du bot à l'historique des messages
            setMessages(prevMessages => [
                ...prevMessages, 
                { role: response.role, content: response.content }
            ]);
        } catch (error) {
            console.error('Erreur:', error);
            setMessages(prevMessages => [
                ...prevMessages, 
                { role: 'assistant', content: "Désolé, une erreur s'est produite." }
            ]);
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-b from-blue-100 to-white">
            <Sidebar />
            <div className="flex-1 p-4 ml-48">
                <div className="bg-white rounded-lg shadow-lg p-4 h-[calc(100vh-2rem)] flex flex-col">
                    <div className="flex-1 overflow-y-auto mb-4">
                        {messages.map((message, index) => (
                            <div key={index} className={`mb-4 ${message.role === 'human' ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block p-3 rounded-lg ${message.role === 'human' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-blue-800'}`}>
                                    {message.content}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Tapez votre message..."
                            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSend}
                            className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <ChevronRightIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
