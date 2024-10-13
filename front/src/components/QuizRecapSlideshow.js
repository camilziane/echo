import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const QuizRecapSlideshow = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const { quizData, quizType, score, totalQuestions } = location.state;
    const [hasIncorrectAnswers, setHasIncorrectAnswers] = useState(false);

    useEffect(() => {
        const incorrectAnswers = quizData.some(q => q.userAnswer !== q.correctAnswer);
        setHasIncorrectAnswers(incorrectAnswers);
        if (!incorrectAnswers) {
            const timer = setTimeout(() => navigate('/quiz-home'), 2000);
            return () => clearTimeout(timer);
        }
    }, [quizData, navigate]);

    if (!hasIncorrectAnswers) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-green-600 mb-4">Perfect Score!</h2>
                    <p className="text-xl text-blue-800">Great job, all answers are correct!</p>
                    <p className="text-xl text-blue-800">Your score: {score} / {totalQuestions}</p>
                </div>
            </div>
        );
    }

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

    const currentQuestion = quizData[currentQuestionIndex];

    const handleQuit = () => {
        navigate('/quiz-home');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col">
            <div className="flex-grow flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-start p-4">
                    <div className="w-full max-w-md">
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">{currentQuestion.question}</h2>
                        
                        {quizType === 'face' && (
                            <img 
                                src={`data:image/jpeg;base64,${currentQuestion.image}`} 
                                alt="Who is this?" 
                                className="w-full h-64 object-cover mb-6 rounded-lg"
                            />
                        )}

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
                        
                        <div className="mt-4 text-center">
                            <button
                                onClick={handleQuit}
                                className="bg-red-500 text-white py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 hover:bg-red-600"
                            >
                                Quit Recap
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizRecapSlideshow;
