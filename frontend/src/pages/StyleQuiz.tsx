import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    text: string;
    value: string;
    look: string;
  }[];
}

const StyleQuiz: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const questions: QuizQuestion[] = [
    {
      id: 'occasion',
      question: 'What\'s your go-to occasion?',
      options: [
        { text: 'Casual hangouts with friends', value: 'casual', look: 'weekend-warrior' },
        { text: 'Office meetings and work', value: 'professional', look: 'smart-casual' },
        { text: 'Street festivals and concerts', value: 'street', look: 'streetwear-king' },
        { text: 'Date nights and parties', value: 'formal', look: 'smart-casual' }
      ]
    },
    {
      id: 'style',
      question: 'Which style resonates with you?',
      options: [
        { text: 'Oversized and comfortable', value: 'oversized', look: 'streetwear-king' },
        { text: 'Fitted and tailored', value: 'fitted', look: 'smart-casual' },
        { text: 'Relaxed and easy-going', value: 'relaxed', look: 'weekend-warrior' },
        { text: 'Bold and statement-making', value: 'bold', look: 'streetwear-king' }
      ]
    },
    {
      id: 'colors',
      question: 'Your favorite color palette?',
      options: [
        { text: 'Neutrals (black, white, gray)', value: 'neutral', look: 'streetwear-king' },
        { text: 'Blues and navy', value: 'blue', look: 'smart-casual' },
        { text: 'Earth tones (brown, green)', value: 'earth', look: 'weekend-warrior' },
        { text: 'Bright and vibrant', value: 'bright', look: 'streetwear-king' }
      ]
    },
    {
      id: 'accessories',
      question: 'How do you accessorize?',
      options: [
        { text: 'Minimal - just a watch', value: 'minimal', look: 'smart-casual' },
        { text: 'Layered bracelets and chains', value: 'layered', look: 'streetwear-king' },
        { text: 'Simple and functional', value: 'functional', look: 'weekend-warrior' },
        { text: 'Statement pieces only', value: 'statement', look: 'streetwear-king' }
      ]
    }
  ];

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResult = () => {
    const lookCounts: Record<string, number> = {};
    
    Object.values(answers).forEach(answer => {
      const question = questions.find(q => 
        q.options.some(opt => opt.value === answer)
      );
      if (question) {
        const option = question.options.find(opt => opt.value === answer);
        if (option) {
          lookCounts[option.look] = (lookCounts[option.look] || 0) + 1;
        }
      }
    });

    const resultLook = Object.keys(lookCounts).reduce((a, b) => 
      lookCounts[a] > lookCounts[b] ? a : b
    );

    setShowResult(true);
    // Navigate to collection with the result
    setTimeout(() => {
      navigate(`/collection?style=${resultLook}`);
    }, 3000);
  };

  const getLookInfo = (lookId: string) => {
    const looks = {
      'streetwear-king': {
        name: 'Streetwear King',
        description: 'You love urban edge and street style!',
        color: 'from-gray-900 to-black',
        textColor: 'text-white'
      },
      'smart-casual': {
        name: 'Smart Casual',
        description: 'You prefer sophisticated and professional looks!',
        color: 'from-blue-900 to-indigo-900',
        textColor: 'text-white'
      },
      'weekend-warrior': {
        name: 'Weekend Warrior',
        description: 'You enjoy relaxed and comfortable vibes!',
        color: 'from-green-900 to-teal-900',
        textColor: 'text-white'
      }
    };
    return looks[lookId as keyof typeof looks] || looks['streetwear-king'];
  };

  if (showResult) {
    const resultLook = Object.keys(answers).reduce((prev, curr) => {
      const question = questions.find(q => 
        q.options.some(opt => opt.value === answers[curr])
      );
      if (question) {
        const option = question.options.find(opt => opt.value === answers[curr]);
        return option ? option.look : prev;
      }
      return prev;
    }, 'streetwear-king');

    const lookInfo = getLookInfo(resultLook);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className={`bg-gradient-to-br ${lookInfo.color} rounded-3xl p-8 text-center shadow-2xl`}>
            <div className="mb-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className={`text-3xl font-bold ${lookInfo.textColor} mb-2`}>
                {lookInfo.name}
              </h2>
              <p className={`text-lg ${lookInfo.textColor} opacity-90`}>
                {lookInfo.description}
              </p>
            </div>
            
            <div className="space-y-4">
              <p className={`text-sm ${lookInfo.textColor} opacity-80`}>
                Redirecting you to your perfect look...
              </p>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isAnswered = answers[currentQ.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Style Quiz</h1>
            <p className="text-gray-400 text-sm">Question {currentQuestion + 1} of {questions.length}</p>
          </div>
          <div className="w-20"></div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{width: `${((currentQuestion + 1) / questions.length) * 100}%`}}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            {currentQ.question}
          </h2>
          
          <div className="space-y-4">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(currentQ.id, option.value)}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                  answers[currentQ.id] === option.value
                    ? 'bg-yellow-400 text-black border-2 border-yellow-300'
                    : 'bg-gray-700/50 text-white hover:bg-gray-600/50 border-2 border-transparent'
                }`}
              >
                <span className="font-medium">{option.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
              currentQuestion === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Previous.
          </button>
          
          <button
            onClick={nextQuestion}
            disabled={!isAnswered}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 ${
              !isAnswered
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-400 text-black hover:bg-yellow-300'
            }`}
          >
            <span>{currentQuestion === questions.length - 1 ? 'Get Results' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleQuiz;

