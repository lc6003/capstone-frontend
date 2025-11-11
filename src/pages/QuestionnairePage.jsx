import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiDollarSign,
  FiShoppingBag,
  FiHome,
  FiMapPin,
  FiShoppingCart,
  FiFilm,
  FiTruck,
  FiHeart,
  FiBook,
  FiCheck,
  FiArrowRight,
  FiArrowLeft
} from "react-icons/fi"
import "../styles/QuestionnairePage.css"

const QuestionnairePage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({
    monthlyIncome: "",
    monthlySavings: "",
    topCategories: [],
    wantsRecommendation: ""
  })

  // Category icons mapping
  const categoryIcons = {
    Food: FiShoppingBag,
    Bills: FiHome,
    Travel: FiMapPin,
    Shopping: FiShoppingCart,
    Entertainment: FiFilm,
    Transport: FiTruck,
    Healthcare: FiHeart,
    Education: FiBook
  }

  const questions = [
    {
      id: "monthlyIncome",
      question: "What's your monthly income?",
      type: "number",
      placeholder: "e.g., 3000",
      required: true,
      icon: FiDollarSign
    },
    {
      id: "monthlySavings",
      question: "How much would you like to save monthly?",
      type: "number",
      placeholder: "e.g., 500",
      required: true,
      icon: FiDollarSign
    },
    {
      id: "topCategories",
      question: "Which categories do you spend the most on?",
      type: "checkbox",
      options: ["Food", "Bills", "Travel", "Shopping", "Entertainment", "Transport", "Healthcare", "Education"],
      required: false
    },
    {
      id: "wantsRecommendation",
      question: "Do you want Cashvelo to recommend a budget plan?",
      type: "radio",
      options: ["Yes", "No"],
      required: true
    }
  ]

  const totalSteps = questions.length

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === "checkbox") {
      const category = value
      setAnswers(prev => ({
        ...prev,
        topCategories: checked
          ? [...prev.topCategories, category]
          : prev.topCategories.filter(c => c !== category)
      }))
    } else {
      setAnswers(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleNext = () => {
    const currentQuestion = questions[currentStep]
    
    // Validate required fields
    if (currentQuestion.required) {
      if (currentQuestion.type === "checkbox") {
        if (answers.topCategories.length === 0 && currentStep === 2) {
          // Allow empty for categories (optional)
          setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1))
          return
        }
      } else if (!answers[currentQuestion.id]) {
        return // Don't proceed if required field is empty
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = () => {
    // Save to localStorage
    localStorage.setItem("userAnswers", JSON.stringify(answers))
    
    // Redirect to dashboard
    navigate("/dashboard")
  }

  const handleSkip = () => {
    // Save empty answers and redirect
    localStorage.setItem("userAnswers", JSON.stringify(answers))
    navigate("/dashboard")
  }

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / totalSteps) * 100
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="questionnaire-page">
      <div className="bg-blob blob-one" />
      <div className="bg-blob blob-two" />
      
      <div className="questionnaire-container">
        <div className="questionnaire-card">
          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>

          {/* Question Content */}
          <div className="question-content">
            {currentQuestion.icon && (
              <div className="question-icon-wrapper">
                <currentQuestion.icon className="question-icon" />
              </div>
            )}
            <h2 className="question-title">{currentQuestion.question}</h2>
            
            <div className="question-input-wrapper">
              {currentQuestion.type === "number" && (
                <div className="input-with-icon">
                  <FiDollarSign className="input-icon" />
                  <input
                    type="number"
                    name={currentQuestion.id}
                    value={answers[currentQuestion.id]}
                    onChange={handleInputChange}
                    placeholder={currentQuestion.placeholder}
                    className="question-input"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {currentQuestion.type === "checkbox" && (
                <div className="checkbox-group">
                  {currentQuestion.options.map((option) => {
                    const IconComponent = categoryIcons[option]
                    return (
                      <label key={option} className="checkbox-label">
                        <input
                          type="checkbox"
                          value={option}
                          checked={answers.topCategories.includes(option)}
                          onChange={handleInputChange}
                          className="checkbox-input"
                        />
                        <div className="checkbox-content">
                          {IconComponent && <IconComponent className="category-icon" />}
                          <span className="checkbox-text">{option}</span>
                        </div>
                        {answers.topCategories.includes(option) && (
                          <FiCheck className="checkbox-check" />
                        )}
                      </label>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === "radio" && (
                <div className="radio-group">
                  {currentQuestion.options.map((option) => (
                    <label key={option} className="radio-label">
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={handleInputChange}
                        className="radio-input"
                      />
                      <div className="radio-content">
                        <span className="radio-text">{option}</span>
                        {answers[currentQuestion.id] === option && (
                          <FiCheck className="radio-check" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="questionnaire-actions">
            <div className="action-buttons">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-back"
                >
                  <FiArrowLeft className="btn-icon" />
                  Back
                </button>
              )}
              
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-next"
                  disabled={
                    currentQuestion.required &&
                    currentQuestion.type !== "checkbox" &&
                    !answers[currentQuestion.id]
                  }
                >
                  Next
                  <FiArrowRight className="btn-icon" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-submit"
                  disabled={
                    currentQuestion.required &&
                    !answers[currentQuestion.id]
                  }
                >
                  Complete Setup
                  <FiCheck className="btn-icon" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="skip-link"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionnairePage
