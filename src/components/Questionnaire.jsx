import React, { useState } from "react";

export default function Questionnaire({ setCurrentPage, user }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    monthlyIncome: "",
    savingsGoal: "",
    riskTolerance: "",
    savingFrequency: "",
    financialPriorities: [],
    emergencyFund: "",
    investmentExperience: "",
    savingAmount: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const questions = [
    {
      id: "monthlyIncome",
      title: "What's your approximate monthly income?",
      type: "select",
      options: [
        { value: "under-2500", label: "Under $2,500" },
        { value: "2500-5000", label: "$2,500 - $5,000" },
        { value: "5000-7500", label: "$5,000 - $7,500" },
        { value: "7500-10000", label: "$7,500 - $10,000" },
        { value: "over-10000", label: "Over $10,000" },
        { value: "prefer-not-to-say", label: "Prefer not to say" }
      ],
      required: true
    },
    {
      id: "savingsGoal",
      title: "What's your primary savings goal?",
      type: "select",
      options: [
        { value: "emergency-fund", label: "Emergency Fund" },
        { value: "vacation", label: "Vacation/Travel" },
        { value: "home", label: "Home Down Payment" },
        { value: "retirement", label: "Retirement" },
        { value: "education", label: "Education" },
        { value: "debt-payoff", label: "Debt Payoff" },
        { value: "general-savings", label: "General Savings" },
        { value: "other", label: "Other" }
      ],
      required: true
    },
    {
      id: "riskTolerance",
      title: "How would you describe your risk tolerance?",
      type: "select",
      options: [
        { value: "conservative", label: "Conservative - I prefer safe, low-risk options" },
        { value: "moderate", label: "Moderate - I'm okay with some risk for better returns" },
        { value: "aggressive", label: "Aggressive - I'm comfortable with higher risk for higher returns" },
        { value: "unsure", label: "I'm not sure" }
      ],
      required: true
    },
    {
      id: "savingFrequency",
      title: "How often would you like to save?",
      type: "select",
      options: [
        { value: "weekly", label: "Weekly" },
        { value: "bi-weekly", label: "Bi-weekly" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" },
        { value: "flexible", label: "Flexible - when I have extra money" }
      ],
      required: true
    },
    {
      id: "financialPriorities",
      title: "What are your top financial priorities? (Select all that apply)",
      type: "checkbox",
      options: [
        { value: "emergency-fund", label: "Building an emergency fund" },
        { value: "debt-reduction", label: "Reducing debt" },
        { value: "retirement", label: "Saving for retirement" },
        { value: "investment", label: "Investing for growth" },
        { value: "education", label: "Education expenses" },
        { value: "home", label: "Home ownership" },
        { value: "travel", label: "Travel and experiences" }
      ],
      required: true
    },
    {
      id: "emergencyFund",
      title: "Do you currently have an emergency fund?",
      type: "select",
      options: [
        { value: "yes-adequate", label: "Yes, I have 3-6 months of expenses saved" },
        { value: "yes-partial", label: "Yes, but less than 3 months of expenses" },
        { value: "no", label: "No, I don't have an emergency fund" },
        { value: "unsure", label: "I'm not sure" }
      ],
      required: true
    },
    {
      id: "investmentExperience",
      title: "What's your experience with investing?",
      type: "select",
      options: [
        { value: "beginner", label: "Beginner - I'm new to investing" },
        { value: "some-experience", label: "Some experience - I've invested before" },
        { value: "experienced", label: "Experienced - I'm comfortable with investing" },
        { value: "no-interest", label: "I prefer not to invest" }
      ],
      required: true
    },
    {
      id: "savingAmount",
      title: "How much would you like to save per period?",
      type: "select",
      options: [
        { value: "under-100", label: "Under $100" },
        { value: "100-250", label: "$100 - $250" },
        { value: "250-500", label: "$250 - $500" },
        { value: "500-1000", label: "$500 - $1,000" },
        { value: "over-1000", label: "Over $1,000" },
        { value: "flexible", label: "It varies based on my income" }
      ],
      required: true
    }
  ];

  const handleAnswerChange = (questionId, value) => {
    if (questions[currentStep].type === "checkbox") {
      setAnswers(prev => ({
        ...prev,
        [questionId]: prev[questionId].includes(value)
          ? prev[questionId].filter(item => item !== value)
          : [...prev[questionId], value]
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    if (currentQuestion.required) {
      if (currentQuestion.type === "checkbox") {
        if (answers[currentQuestion.id].length === 0) {
          setError("Please select at least one option.");
          return;
        }
      } else {
        if (!answers[currentQuestion.id]) {
          setError("Please select an option.");
          return;
        }
      }
    }
    
    setError("");
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Here you would typically save the questionnaire data to your database
      // For now, we'll just log it and proceed to the home page
      console.log("Questionnaire answers:", answers);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to home page
      setCurrentPage("home");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="card questionnaire-card">
      <div className="card-body">
        <div className="center">
          <div className="illustration">
            <img src="/cat-envelope.jpg" alt="Cashvelo logo" className="cat-hero" />
          </div>
          <h1>Let's personalize your savings journey</h1>
          <p className="subtitle">
            Help us understand your financial goals so we can provide better recommendations.
          </p>
        </div>

        {/* Progress bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="progress-text">
            Question {currentStep + 1} of {questions.length}
          </p>
        </div>

        {/* Question */}
        <div className="question-container">
          <h2 className="question-title">{currentQuestion.title}</h2>
          
          {currentQuestion.type === "select" && (
            <div className="options-container">
              {currentQuestion.options.map((option) => (
                <label key={option.value} className="option-label">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.value}
                    checked={answers[currentQuestion.id] === option.value}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="option-input"
                  />
                  <span className="option-text">{option.label}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === "checkbox" && (
            <div className="options-container">
              {currentQuestion.options.map((option) => (
                <label key={option.value} className="option-label checkbox-label">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={answers[currentQuestion.id].includes(option.value)}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, option.value)}
                    className="option-input"
                  />
                  <span className="option-text">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Navigation buttons */}
        <div className="questionnaire-navigation">
          {currentStep > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrevious}
              disabled={loading}
            >
              Previous
            </button>
          )}
          
          <button
            type="button"
            className="btn"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? "Saving..." : currentStep === questions.length - 1 ? "Complete Setup" : "Next"}
          </button>
        </div>

        {/* Skip option */}
        <div className="center" style={{ marginTop: "16px" }}>
          <button
            type="button"
            className="skip-button"
            onClick={() => setCurrentPage("home")}
            disabled={loading}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
