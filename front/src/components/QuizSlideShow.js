import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/solid';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const QuizSlideshow = () => {
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [showRecap, setShowRecap] = useState(false);
    const [theme, setTheme] = useState('');  // New state for theme

    useEffect(() => {
        // Fetch questions and theme from your API
        // This is a placeholder, replace with actual API call
        setTheme('Geography');  // Set the theme
        setQuestions([
            {
                id: 1,
                question: "What is the capital of France?",
                options: ["London", "Berlin", "Paris", "Madrid"],
                correctAnswer: "Paris"
            },
            {
                id: 2,
                question: "Which planet is known as the Red Planet?",
                options: ["Mars", "Venus", "Jupiter", "Saturn"],
                correctAnswer: "Mars"
            },
            // Add more questions...
        ]);
    }, []);

    const handleNext = () => {
        if (selectedAnswer === questions[currentQuestionIndex].correctAnswer) {
            setScore(score + 1);
        }
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
        } else {
            // Quiz finished
            setShowRecap(true);
        }
    };

    if (questions.length === 0) {
        return <div>Loading...</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col">
            {/* Progress bar */}
            <div className="w-full bg-blue-200 h-2">
                <div className="bg-blue-600 h-2 transition-all duration-300 ease-in-out" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="flex-grow flex flex-col">
                {/* Theme display */}
                <div className="text-center flex-1 flex items-center justify-center">
                    <h1 className="text-4xl font-bold text-blue-800">{theme}</h1>
                </div>

                {/* Question and answers */}
                <div className="flex-1 flex flex-col items-center justify-start p-4">
                    <div className="w-full max-w-md">
                        <h2 className="text-2xl font-bold text-blue-800 mb-6">{currentQuestion.question}</h2>

                        <RadioGroup value={selectedAnswer} onChange={setSelectedAnswer} className="space-y-4">
                            {currentQuestion.options.map((option) => (
                                <RadioGroup.Option
                                    key={option}
                                    value={option}
                                    className={({ active, checked }) =>
                                        `${active ? 'ring-2 ring-blue-600 ring-opacity-60 ring-offset-2' : ''}
                                        ${checked ? 'bg-blue-600 text-white' : 'bg-white'}
                                        relative rounded-lg shadow-md px-5 py-4 cursor-pointer flex items-center justify-between focus:outline-none`
                                    }
                                >
                                    {({ checked }) => (
                                        <>
                                            <div className="flex items-center">
                                                <div className="text-sm">
                                                    <RadioGroup.Label as="p" className={`font-medium ${checked ? 'text-white' : 'text-gray-900'}`}>
                                                        {option}
                                                    </RadioGroup.Label>
                                                </div>
                                            </div>
                                            {checked && (
                                                <div className="flex-shrink-0 text-white">
                                                    <CheckCircleIcon className="w-6 h-6" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </RadioGroup.Option>
                            ))}
                        </RadioGroup>

                        <button
                            onClick={handleNext}
                            disabled={!selectedAnswer}
                            className={`mt-8 w-full py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
                                selectedAnswer
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                        </button>
                    </div>
                </div>
            </div>

            <QuizRecap
                isOpen={showRecap}
                closeRecap={() => {
                    setShowRecap(false);
                    navigate('/quiz-home', { state: { score, total: questions.length } });
                }}
                score={score}
                total={questions.length}
            />
        </div>
    );
};

const QuizRecap = ({ isOpen, closeRecap, score, total }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={closeRecap}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-blue-900"
                                >
                                    Quiz Completed!
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-blue-700">
                                        Your score: {score} out of {total}
                                    </p>
                                </div>

                                <div className="mt-4">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        onClick={closeRecap}
                                    >
                                        See Full Results
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default QuizSlideshow;
