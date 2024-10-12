import React, { useState } from 'react';
import { RemoteRunnable } from "@langchain/core/runnables/remote";

const chain = new RemoteRunnable({ url: `http://localhost:8001/rag/c/N4XyA/` });


const Chatbot = () => {
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Hello! What do you remember about this trip?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = async () => {
        if (input.trim() === '') return;

        const newMessage = { role: 'user', content: input };
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInput('');

        try {
            const response = await chain.invoke({ messages: updatedMessages });
            // Handle the response here
            setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="chatbot-page">
            <h2>Écho Chatbot</h2>
            <div className="chatbox">
                {messages.map((message, index) => (
                    <div key={index} className={`chat-message ${message.role}`}>
                        {message.content}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>Send</button>
        </div>
    );
};

export default Chatbot;
