import React, { useState } from 'react';
import ItineraryForm from './components/ItineraryForm';
import './App.css';

function App() {
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);

  const handleSuccess = (id) => {
    setSubmissionId(id);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmissionId(null);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🌍 Travel Itinerary Planner</h1>
          <p className="subtitle">Plan your perfect trip with us</p>
        </header>

        {!submitted ? (
          <ItineraryForm onSuccess={handleSuccess} />
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Thank You!</h2>
            <p>Your itinerary request has been submitted successfully.</p>
            <p className="submission-id">Request ID: #{submissionId}</p>
            <p className="success-note">
              Our travel experts will review your request and get back to you soon with a customized itinerary.
            </p>
            <button onClick={handleReset} className="btn btn-secondary">
              Submit Another Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

