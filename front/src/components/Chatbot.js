import React, { useState } from 'react';
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
        <div className="chatbot-page">
            <h2>Chatbot LangServe</h2>
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
                placeholder="Tapez votre message..."
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>Envoyer</button>
        </div>
    );
};

export default Chatbot;