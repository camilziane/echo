import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/solid';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import * as uuid from 'uuid';

// Shuffle function
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const QuizSlideshow = () => {
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [showRecap, setShowRecap] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userAnswers, setUserAnswers] = useState([]);
    const [quizId, setQuizId] = useState(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    useEffect(() => {
        console.log("questions", questions);
    }, [questions]); 

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/generate-quiz', {
                method: 'GET',
            });
            if (!response.ok) {
                throw new Error('Failed to start quiz');
            }
            const questions = await response.json();
            const quizId = uuid.v4(); // Generate a unique ID for this quiz session
            setQuizId(quizId);
            const fetchedQuestions = questions.map(q => ({
                id: q.question_id,
                question: q.question,
                options: shuffleArray([q.correct_answer, ...q.bad_answer]),
                correctAnswer: q.correct_answer
            }));
            setQuestions(fetchedQuestions);
        } catch (error) {
            console.error('Error fetching quiz questions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinishQuiz = async () => {
        try {
            const response = await fetch('http://localhost:8000/finish-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quiz_id: quizId,
                    score: score,
                    total_questions: questions.length,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to save quiz results');
            }
            setShowRecap(true);
        } catch (error) {
            console.error('Error saving quiz results:', error);
        }
    };

    const handleNext = async () => {
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        
        if (isCorrect) {
            setScore(score + 1);
        }

        // Save user's answer
        setUserAnswers([...userAnswers, selectedAnswer]);

        // Submit the answer to the backend
        try {
            const response = await fetch(`http://localhost:8000/submit-answer?question_id=${currentQuestion.id}&success=${isCorrect}`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to submit answer');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
        }

        if (currentQuestionIndex === questions.length - 1) {
            // Quiz finished
            await handleFinishQuiz();
        } else {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (questions.length === 0) {
        return <div className="flex justify-center items-center h-screen">No questions available. Please try again later.</div>;
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
                    const quizData = questions.map((q, index) => ({
                        ...q,
                        userAnswer: userAnswers[index]
                    }));
                    navigate('/quiz-recap', { state: { quizData } });
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
