import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const QuizPage = () => {
    const [quizHistory, setQuizHistory] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Fetch quiz history from your API
        // This is a placeholder, replace with actual API call
        setQuizHistory([
            { id: 5, score: 95, date: '2023-05-09' },
            { id: 4, score: 75, date: '2023-05-07' },
            { id: 3, score: 90, date: '2023-05-05' },
            { id: 2, score: 65, date: '2023-05-03' },
            { id: 1, score: 80, date: '2023-05-01' },
        ]);
    }, []);

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-blue-600';
        if (score >= 80) return 'text-blue-500';
        if (score >= 70) return 'text-blue-400';
        if (score >= 60) return 'text-blue-300';
        return 'text-blue-200';
    };

    const isCreateMemoryPage = location.pathname === '/create-memory';

    return (
        <div className="flex min-h-screen bg-gradient-to-b from-blue-100 to-white">
            <Sidebar />

            {/* Main content */}
            <div className={`flex-1 ${isCreateMemoryPage ? '' : 'ml-48'}`}>
                <div className="max-w-3xl mx-auto p-4">
                    {/* Quiz History */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold text-blue-800 mb-4">Recent Quiz History</h2>
                        <div className="grid grid-cols-5 gap-4">
                            {quizHistory.slice(0, 5).map((quiz) => (
                                <div key={quiz.id} className="flex flex-col items-center">
                                    <div className={`relative w-20 h-20 ${getScoreColor(quiz.score)}`}>
                                        <svg viewBox="0 0 36 36" className="w-20 h-20 transform -rotate-90">
                                            <path
                                                d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeDasharray={`${quiz.score}, 100`}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-semibold">{quiz.score}%</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-2">{quiz.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Start New Quiz Button */}
                    <button
                        onClick={() => navigate('/quiz')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                    >
                        Start New Quiz
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;
