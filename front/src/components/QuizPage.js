import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ScrollReveal from 'scrollreveal';

const QuizPage = () => {
    const [quizHistory, setQuizHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const fieldsRef = useRef([]);

    useEffect(() => {
        fetchQuizHistory();
    }, [location]);

    useEffect(() => {
        const sr = ScrollReveal({
            origin: 'bottom',
            distance: '20px',
            duration: 600,
            delay: 200,
            easing: 'ease-in-out',
            reset: false
        });

        const revealElements = () => {
            fieldsRef.current.forEach((el, index) => {
                if (el) {
                    sr.reveal(el, {
                        delay: index * 100
                    });
                }
            });
        };

        // Add a slight delay to ensure elements are in the DOM
        const timeoutId = setTimeout(revealElements, 100);

        return () => {
            clearTimeout(timeoutId);
            sr.destroy();
        };
    }, [quizHistory, isLoading]);

    const fetchQuizHistory = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/quiz-history');
            const data = await response.json();
            setQuizHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch quiz history:', error);
            setQuizHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const startQuiz = (quizType) => {
        navigate('/quiz', { state: { quizType } });
    };

    const getScoreColor = (score) => {
        if (score >= 90) return '#1E3A8A'; // Dark blue
        if (score >= 80) return '#2563EB'; // Blue
        if (score >= 70) return '#3B82F6'; // Light blue
        if (score >= 60) return '#60A5FA'; // Very light blue
        return '#93C5FD'; // Pale blue
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-r from-blue-400 via-indigo-300 to-white text-blue-800">
            <Sidebar />

            {/* Main content */}
            <div className="flex-1 ml-48">
                <div className="max-w-3xl mx-auto p-4">
                    {/* Quiz history */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6" ref={el => fieldsRef.current[0] = el}>
                        <h2 className="text-xl font-semibold text-blue-800 mb-4">Recent Quiz History</h2>
                        {isLoading ? (
                            <p>Loading quiz history...</p>
                        ) : quizHistory.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-lg text-gray-600 mb-2">Your quiz history is empty.</p>
                                <p className="text-xl">It's time to start your quiz adventure! 🚀</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-4">
                                {quizHistory.map((quiz, index) => {
                                    const scorePercentage = (quiz.score / quiz.total_questions) * 100;
                                    const scoreColor = getScoreColor(scorePercentage);

                                    return (
                                        <div key={quiz.id} className="flex flex-col items-center" ref={el => fieldsRef.current[index + 1] = el}>
                                            <div className="relative w-20 h-20">
                                                <svg viewBox="0 0 36 36" className="w-20 h-20 transform -rotate-90">
                                                    <path
                                                        className="text-gray-200"
                                                        d="M18 2.0845
                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    />
                                                    <path
                                                        d="M18 2.0845
                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke={scoreColor}
                                                        strokeWidth="2"
                                                        strokeDasharray="100"
                                                        strokeDashoffset="100"
                                                        style={{
                                                            animation: `progress-${quiz.id} 1s ease-out forwards`,
                                                        }}
                                                    />
                                                    <style>
                                                        {`
                                                        @keyframes progress-${quiz.id} {
                                                            from {
                                                                stroke-dashoffset: 100;
                                                            }
                                                            to {
                                                                stroke-dashoffset: ${100 - scorePercentage};
                                                            }
                                                        }
                                                        `}
                                                    </style>
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-lg font-semibold">{Math.round(scorePercentage)}%</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500 mt-2">{new Date(quiz.date).toLocaleDateString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Buttons to start a new quiz */}
                    <div className="grid grid-cols-2 gap-4 mt-6" ref={el => fieldsRef.current[quizHistory.length + 1] = el}>
                        <button
                            onClick={() => startQuiz('souvenirs')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                        >
                            Memories Quiz
                        </button>
                        <button
                            onClick={() => startQuiz('face')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                        >
                            Faces Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;
