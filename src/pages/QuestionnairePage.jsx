import React, { useState } from "react";

const QuestionnairePage = () => {
  const [formData, setFormData] = useState({
    income: "",
    savingsGoal: "",
    categories: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("User Responses:", formData);
    // Later: send this data to Firebase or your API
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-emerald-700 text-center mb-6">
          Welcome! Let’s set up your Cash Envelopes
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Monthly Income
            </label>
            <input
              type="number"
              name="income"
              value={formData.income}
              onChange={handleChange}
              placeholder="e.g., 3000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Savings Goal
            </label>
            <input
              type="number"
              name="savingsGoal"
              value={formData.savingsGoal}
              onChange={handleChange}
              placeholder="e.g., 500"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Spending Categories
            </label>
            <textarea
              name="categories"
              value={formData.categories}
              onChange={handleChange}
              placeholder="e.g., Rent, Groceries, Entertainment"
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Save and Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuestionnairePage;
