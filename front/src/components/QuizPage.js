import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const QuizPage = () => {
    const [quizHistory, setQuizHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchQuizHistory();
    }, [location]);

    const fetchQuizHistory = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/quiz-history');
            const data = await response.json();
            // Ensure that data is an array before setting it to state
            setQuizHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch quiz history:', error);
            setQuizHistory([]); // Set to empty array in case of error
        } finally {
            setIsLoading(false);
        }
    };

    const startQuiz = (quizType) => {
        navigate('/quiz', { state: { quizType } });
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-blue-600';
        if (score >= 80) return 'text-blue-500';
        if (score >= 70) return 'text-blue-400';
        if (score >= 60) return 'text-blue-300';
        return 'text-blue-200';
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-blue-100 to-white">
            <Sidebar />

            {/* Main content */}
            <div className="flex-1 ml-48">
                <div className="max-w-3xl mx-auto p-4">
                    {/* Quiz History */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold text-blue-800 mb-4">Recent Quiz History</h2>
                        {isLoading ? (
                            <p>Loading quiz history...</p>
                        ) : quizHistory.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-lg text-gray-600 mb-2">Your quiz history is empty.</p>
                                <p className="text-xl">Time to start your quiz journey! 🚀</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-4">
                                {quizHistory.map((quiz) => (
                                    <div key={quiz.id} className="flex flex-col items-center">
                                        <div className={`relative w-20 h-20 ${getScoreColor(quiz.score / quiz.total_questions * 100)}`}>
                                            <svg viewBox="0 0 36 36" className="w-20 h-20 transform -rotate-90">
                                                <path
                                                    d="M18 2.0845
                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeDasharray={`${(quiz.score / quiz.total_questions) * 100}, 100`}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-lg font-semibold">{Math.round((quiz.score / quiz.total_questions) * 100)}%</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500 mt-2">{new Date(quiz.date).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Start New Quiz Buttons */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <button
                            onClick={() => startQuiz('souvenirs')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                        >
                            Start Souvenirs Quiz
                        </button>
                        <button
                            onClick={() => startQuiz('face')}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                        >
                            Start Face Recognition Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;
