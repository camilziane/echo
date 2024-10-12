import React from 'react';
const Chatbot = () => {
    return (
        <div className="chatbot-page">
            <h2>Écho Chatbot</h2>
            <div className="chatbox">
                {/* Placeholder for chatbot interactions */}
                <div className="chat-message">Hello! What do you remember about this trip?</div>
            </div>
            <input type="text" placeholder="Type your response..." />
            <button>Send</button>
        </div>
    );
};
export default Chatbot;
