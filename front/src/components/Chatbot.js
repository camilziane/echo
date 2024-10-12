import React, { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/solid';
import Sidebar from './Sidebar';

const Chatbot = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! What would you like to know ?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim()) {
            setMessages([...messages, { role: 'user', content: input }]);
            // Here you would typically send the input to your backend for processing
            // For now, we'll just echo the user's message
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'assistant', content: `You said: ${input}` }]);
            }, 500);
            setInput('');
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-b from-blue-100 to-white">
            <Sidebar />
            <div className="flex-1 p-4 ml-48">
                <div className="bg-white rounded-lg shadow-lg p-4 h-[calc(100vh-2rem)] flex flex-col">
                    <div className="flex-1 overflow-y-auto mb-4">
                        {messages.map((message, index) => (
                            <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-blue-800'}`}>
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
                            placeholder="Type your message..."
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
