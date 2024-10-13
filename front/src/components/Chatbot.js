import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { Button, CircularProgress, Typography } from "@mui/material";
import {
  MicrophoneIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/outline";
import ScrollReveal from "scrollreveal";

// Create an instance of RemoteRunnable to communicate with the LangServe server
const chain = new RemoteRunnable({ url: "http://localhost:8000/rag/c/N4XyA/" });

const BotMessage = ({ content, id }) => {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);
  const messageRef = useRef(null);

  useEffect(() => {
    // Reset displayed text and index for each new content
    setDisplayedText("");
    indexRef.current = 0;

    const revealConfig = {
      duration: 200, // Reduced duration for faster reveal
      delay: 0,
      distance: "20px",
      easing: "ease-in-out",
      origin: "left",
    };

    if (messageRef.current) {
      ScrollReveal().reveal(messageRef.current, revealConfig);
    }

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + content.charAt(indexRef.current));
      indexRef.current += 1;
      if (indexRef.current >= content.length) {
        clearInterval(interval);
      }
    }, 1); // Reduced interval duration for faster text reveal

    return () => clearInterval(interval);
  }, [content]);

  return (
    <div
      ref={messageRef}
      className="inline-block p-4 m-4 rounded-lg bg-gray-50 text-blue-800 text-xl shadow-lg transition-transform transform hover:scale-105"    >
      {displayedText}
    </div>
  );
};

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      role: "assistant",
      content: "Hello! How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("");

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US"; // Set language to English
      window.speechSynthesis.speak(utterance);
    } else {
      console.error("The Web Speech API is not supported by this browser.");
    }
  };

  // Define refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleSend = async () => {
    if (input.trim() === "") {
      return;
    }

    const userMessage = {
      id: Date.now() + 1, // Generate a unique ID
      role: "human",
      content: input,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    try {
      // Invoke the LangServe chain with the message history
      const response = await chain.invoke({
        messages: messages.concat(userMessage),
      });

      speak(response.content);

      // Add the bot's response to the message history
      const botMessage = {
        id: Date.now() + 2, // Generate a unique ID
        role: "assistant",
        content: response.content,
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now() + 3,
          role: "assistant",
          content: "Sorry, an error occurred.",
        },
      ]);
    }
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
        setInput(data.transcription);
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
  

  return (
    <div className="flex h-screen bg-gradient-to-b from-blue-100 to-white">
      <Sidebar />
      <div className="flex-1 p-4 ml-48">
        <div className=" bg-gradient-to-b from-blue-100 to-white text-blue-800 rounded-lg p-4 h-[calc(100vh-2rem)] flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${
                  message.role === "human" ? "text-right" : "text-left"
                }`}
              >
                {message.role === "assistant" ? (
                  <BotMessage content={message.content} id={message.id} />
                ) : (
<div className="inline-block p-4 m-4 rounded-lg bg-blue-600 text-white text-xl shadow-lg border border-gray-300 transition-transform transform hover:scale-105">
{message.content}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center">
          <input
  type="text"
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyPress={(e) => e.key === "Enter" && handleSend()}
  placeholder="Type your message..."
  className="flex-1 p-3 border border-transparent rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-md transition duration-300 ease-in-out hover:shadow-lg placeholder-gray-500"
/>

            <button
              onClick={toggleRecording}
              className={`text-blue-600 p-2 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isRecording ? "text-blue-700" : ""
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
            <button
              onClick={handleSend}
              className="text-blue-600 p-2 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
          {status && (
            <div className="flex items-center justify-center mt-2">
              <CircularProgress size={20} style={{ marginRight: "10px" }} />
              <Typography variant="body1">{status}</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
