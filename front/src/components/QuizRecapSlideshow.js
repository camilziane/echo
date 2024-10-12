import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const QuizRecapSlideshow = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const { quizData } = location.state;

    const currentQuestion = quizData[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;

    const handleNext = () => {
        if (currentQuestionIndex < quizData.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            navigate('/quiz-home');
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col">
            {/* Progress bar */}
            <div className="w-full bg-blue-200 h-2">
                <div className="bg-blue-600 h-2 transition-all duration-300 ease-in-out" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="flex-grow flex flex-col">
                {/* Question and answers */}
                <div className="flex-1 flex flex-col items-center justify-start p-4">
                    <div className="w-full max-w-md">
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">{currentQuestion.question}</h2>

                        <div className="space-y-4">
                            {currentQuestion.options.map((option) => (
                                <div
                                    key={option}
                                    className={`p-4 rounded-lg shadow-md ${
                                        option === currentQuestion.correctAnswer
                                            ? 'bg-green-100 border-2 border-green-500'
                                            : option === currentQuestion.userAnswer && option !== currentQuestion.correctAnswer
                                            ? 'bg-red-100 border-2 border-red-500'
                                            : 'bg-white'
                                    }`}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestionIndex === 0}
                                className={`py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
                                    currentQuestionIndex === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={handleNext}
                                className="bg-blue-600 text-white py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 hover:bg-blue-700"
                            >
                                {currentQuestionIndex === quizData.length - 1 ? 'Finish' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizRecapSlideshow;
