import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/solid';
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
    const location = useLocation();
    const { quizType } = location.state;
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [quizId, setQuizId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userAnswers, setUserAnswers] = useState([]);
    const [quizFinished, setQuizFinished] = useState(false);
    const [totalMembers, setTotalMembers] = useState(0);

    useEffect(() => {
        generateQuestions();
    }, [quizType]);

    const generateQuestions = async () => {
        setIsLoading(true);
        try {
            let response;
            if (quizType === 'souvenirs') {
                response = await fetch('http://localhost:8000/generate-quiz?nb_quiz=5');
            } else {
                response = await fetch('http://localhost:8000/profiles');
            }
            const data = await response.json();
            
            let generatedQuestions;
            if (quizType === 'souvenirs') {
                generatedQuestions = data.map(q => ({
                    id: q.question_id,
                    question: q.question,
                    options: shuffleArray([q.correct_answer, ...q.bad_answer]),
                    correctAnswer: q.correct_answer
                }));
            } else {
                generatedQuestions = generateFaceRecognitionQuestions(data);
                setTotalMembers(data.length); // Set the total number of members
            }
            
            setQuestions(generatedQuestions);
            setQuizId(uuid.v4());
        } catch (error) {
            console.error('Failed to fetch questions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateFaceRecognitionQuestions = (profiles) => {
        return profiles.map(profile => ({
            id: uuid.v4(),
            question: "Who is this person?",
            image: profile.image,
            options: shuffleArray([
                profile.name,
                ...profiles.filter(p => p.id !== profile.id)
                    .map(p => p.name)
                    .slice(0, 3)
            ]),
            correctAnswer: profile.name
        }));
    };

    const handleNext = () => {
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        
        const updatedUserAnswers = [...userAnswers, selectedAnswer];
        setUserAnswers(updatedUserAnswers);

        if (currentQuestionIndex === questions.length - 1) {
            const finalScore = updatedUserAnswers.filter((answer, index) => answer === questions[index].correctAnswer).length;
            setScore(finalScore);
            handleFinishQuiz(updatedUserAnswers, finalScore);
        } else {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
        }
    };

    const handleFinishQuiz = async (finalUserAnswers, finalScore) => {
        const quizResult = {
            id: quizId,
            type: quizType,
            score: finalScore,
            total_questions: questions.length,
            date: new Date().toISOString(),
        };

        try {
            const response = await fetch('http://localhost:8000/finish-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizResult),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setQuizFinished(true);
        } catch (error) {
            console.error('Failed to save quiz results:', error);
        }
    };

    const handleViewRecap = () => {
        navigate('/quiz-recap', { 
            state: { 
                quizData: questions.map((q, i) => ({ ...q, userAnswer: userAnswers[i] })),
                quizType,
            } 
        });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (questions.length === 0) {
        return <div className="flex justify-center items-center h-screen">No questions available. Please try again later.</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    if (quizFinished) {
        const finalScore = score;
        const totalQuestions = questions.length;

        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <h2 className="text-3xl font-bold text-blue-800 mb-4">Quiz Completed!</h2>
                    <p className="text-xl text-gray-700 mb-6">Your score: {finalScore} / {totalQuestions}</p>
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={() => navigate('/quiz-recap', { 
                                state: { 
                                    quizData: questions.map((q, i) => ({ ...q, userAnswer: userAnswers[i] })),
                                    quizType,
                                    score: finalScore,
                                    totalQuestions: totalQuestions
                                } 
                            })}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            View Recap
                        </button>
                        <button
                            onClick={() => navigate('/quiz-home')}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                        >
                            Back to Quiz Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col">
            <div className="w-full bg-blue-200 h-2">
                <div className="bg-blue-600 h-2 transition-all duration-300 ease-in-out" style={{ width: `${progress}%` }}></div>
            </div>

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
        </div>
    );
};

export default QuizSlideshow;
