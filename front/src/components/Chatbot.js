import React, { useState, useRef } from "react";
import Sidebar from "./Sidebar";
import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { Button, CircularProgress, Typography } from "@mui/material";

// Création d'une instance RemoteRunnable pour communiquer avec le serveur LangServe
const chain = new RemoteRunnable({ url: "http://localhost:8000/rag/c/N4XyA/" });

const Chatbot = () => {
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Bonjour ! Comment puis-je vous aider aujourd'hui ?" },
    ]);
    const [input, setInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("");

    // Définir les refs
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const handleSend = async () => {
        console.log("handleSend called with input:", input);

        if (input.trim() === "") {
            console.log("Input is empty, returning.");
            return;
        }

        const userMessage = { role: "human", content: input };
        console.log("User message created:", userMessage);

        setMessages((prevMessages) => {
            const newMessages = [...prevMessages, userMessage];
            console.log("Updated messages state:", newMessages);
            return newMessages;
        });

        setInput("");
        console.log("Input cleared.");

        try {
            // Invocation de la chaîne LangServe avec l'historique des messages
            console.log("Invoking chain with messages:", messages.concat(userMessage));
            const response = await chain.invoke({
                messages: messages.concat(userMessage),
            });

            console.log("Réponse reçue:", response.content);
            // Ajout de la réponse du bot à l'historique des messages
            setMessages((prevMessages) => {
                const newMessages = [
                    ...prevMessages,
                    { role: response.role, content: response.content },
                ];
                console.log("Updated messages state with bot response:", newMessages);
                return newMessages;
            });
        } catch (error) {
            console.error("Erreur:", error);
            setMessages((prevMessages) => {
                const newMessages = [
                    ...prevMessages,
                    { role: "assistant", content: "Désolé, une erreur s'est produite." },
                ];
                console.log("Updated messages state with error message:", newMessages);
                return newMessages;
            });
        }
    };

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

    const sendAudioToServer = async (audioBlob) => {
        console.log("Envoi de l'audio au serveur...");
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.mp3");

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
                console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Données de transcription reçues:", data);

            if (data.error) {
                setStatus(`Erreur : ${data.error}`);
            } else {
                setInput(data.transcription);
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
        <div className="flex h-screen bg-gradient-to-b from-blue-100 to-white">
            <Sidebar />
            <div className="flex-1 p-4 ml-48">
                <div className="bg-white rounded-lg shadow-lg p-4 h-[calc(100vh-2rem)] flex flex-col">
                    <div className="flex-1 overflow-y-auto mb-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`mb-4 ${message.role === "human" ? "text-right" : "text-left"}`}
                            >
                                <div
                                    className={`inline-block p-3 rounded-lg ${
                                        message.role === "human" ? "bg-blue-600 text-white" : "bg-gray-200 text-blue-800"
                                    }`}
                                >
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
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Tapez votre message..."
                            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                            variant="contained"
                            color={isRecording ? "secondary" : "primary"}
                            onClick={toggleRecording}
                            style={{ margin: "0 10px" }}
                        >
                            {isRecording ? "Arrêter" : "Enregistrer"}
                        </Button>
                        <button
                            onClick={handleSend}
                            className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Envoyer
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