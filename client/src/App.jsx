import React, { useState, useEffect } from 'react';
import ItineraryForm from './components/ItineraryForm';
import Suggestions from './components/Suggestions';
import './App.css';

const STAGES = {
  form: 'form',
  loading: 'loading',
  suggestions: 'suggestions',
};

function App() {
  const [stage, setStage] = useState(STAGES.form);
  const [submission, setSubmission] = useState(null);
  const [selectedExperiences, setSelectedExperiences] = useState({});

  useEffect(() => {
    if (stage === STAGES.loading) {
      const timer = setTimeout(() => {
        setStage(STAGES.suggestions);
      }, 1200);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [stage]);

  const handleSuccess = (payload) => {
    setSubmission(payload);
    setSelectedExperiences({});
    setStage(STAGES.loading);
  };

  const handleReset = () => {
    setStage(STAGES.form);
    setSubmission(null);
    setSelectedExperiences({});
  };

  const handleToggleExperience = (destinationLabel, experienceName) => {
    setSelectedExperiences((prev) => {
      const current = prev[destinationLabel] || [];
      const exists = current.includes(experienceName);
      return {
        ...prev,
        [destinationLabel]: exists
          ? current.filter((item) => item !== experienceName)
          : [...current, experienceName],
      };
    });
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🌍 Travel Itinerary Planner</h1>
          <p className="subtitle">Plan your perfect trip with us</p>
        </header>

        {stage === STAGES.form && <ItineraryForm onSuccess={handleSuccess} />}

        {stage === STAGES.loading && (
          <div className="loading-panel">
            <div className="spinner" />
            <h2>Building a first draft...</h2>
            <p>
              We are looking up popular experiences in your destinations so you can cherry-pick what excites you.
            </p>
          </div>
        )}

        {stage === STAGES.suggestions && submission && (
          <Suggestions
            submission={submission}
            selections={selectedExperiences}
            onToggleExperience={handleToggleExperience}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

export default App;

