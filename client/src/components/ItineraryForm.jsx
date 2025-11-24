import React, { useState } from 'react';
import './ItineraryForm.css';

const ItineraryForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destinations: [],
    newDestination: '',
    budget: '',
    days: '',
    foodPreferences: [],
    stayPreferences: [],
    sightseeing: '',
    permissions: '',
    specialRequests: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const foodOptions = [
    'Vegetarian',
    'Vegan',
    'Halal',
    'Kosher',
    'Gluten-Free',
    'Dairy-Free',
    'No Restrictions'
  ];

  const stayOptions = [
    'Luxury Hotels',
    'Budget Hotels',
    'Hostels',
    'Airbnb',
    'Resorts',
    'Homestays',
    'Camping'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddDestination = () => {
    if (formData.newDestination.trim()) {
      setFormData(prev => ({
        ...prev,
        destinations: [...prev.destinations, prev.newDestination.trim()],
        newDestination: ''
      }));
    }
  };

  const handleRemoveDestination = (index) => {
    setFormData(prev => ({
      ...prev,
      destinations: prev.destinations.filter((_, i) => i !== index)
    }));
  };

  const handleCheckboxChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.destinations.length === 0) {
      newErrors.destinations = 'At least one destination is required';
    }

    if (!formData.budget) {
      newErrors.budget = 'Budget is required';
    } else if (isNaN(formData.budget) || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Please enter a valid budget amount';
    }

    if (!formData.days) {
      newErrors.days = 'Number of days is required';
    } else if (isNaN(formData.days) || parseInt(formData.days) <= 0) {
      newErrors.days = 'Please enter a valid number of days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          destinations: formData.destinations,
          budget: parseFloat(formData.budget),
          days: parseInt(formData.days),
          foodPreferences: formData.foodPreferences,
          stayPreferences: formData.stayPreferences,
          sightseeing: formData.sightseeing,
          permissions: formData.permissions,
          specialRequests: formData.specialRequests
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit itinerary');
      }

      onSuccess({
        id: data.id,
        suggestions: data.suggestions || [],
        formSnapshot: {
          name: formData.name,
          email: formData.email,
          budget: parseFloat(formData.budget),
          days: parseInt(formData.days, 10),
          destinations: formData.destinations,
        },
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit itinerary. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="itinerary-form" onSubmit={handleSubmit}>
      {/* Personal Information */}
      <section className="form-section">
        <h2 className="section-title">Personal Information</h2>
        
        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={errors.name ? 'error' : ''}
            placeholder="Enter your full name"
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? 'error' : ''}
            placeholder="your.email@example.com"
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={errors.phone ? 'error' : ''}
            placeholder="+1 (555) 123-4567"
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>
      </section>

      {/* Travel Details */}
      <section className="form-section">
        <h2 className="section-title">Travel Details</h2>
        
        <div className="form-group">
          <label htmlFor="destinations">Destinations *</label>
          <div className="destination-input-group">
            <input
              type="text"
              id="newDestination"
              name="newDestination"
              value={formData.newDestination}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDestination();
                }
              }}
              placeholder="Enter a destination and press Enter or click Add"
            />
            <button
              type="button"
              onClick={handleAddDestination}
              className="btn btn-add"
            >
              Add
            </button>
          </div>
          {formData.destinations.length > 0 && (
            <div className="destination-tags">
              {formData.destinations.map((dest, index) => (
                <span key={index} className="destination-tag">
                  {dest}
                  <button
                    type="button"
                    onClick={() => handleRemoveDestination(index)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.destinations && (
            <span className="error-message">{errors.destinations}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="budget">Budget (USD) *</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              className={errors.budget ? 'error' : ''}
              placeholder="5000"
              min="0"
              step="0.01"
            />
            {errors.budget && <span className="error-message">{errors.budget}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="days">Number of Days *</label>
            <input
              type="number"
              id="days"
              name="days"
              value={formData.days}
              onChange={handleInputChange}
              className={errors.days ? 'error' : ''}
              placeholder="7"
              min="1"
            />
            {errors.days && <span className="error-message">{errors.days}</span>}
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="form-section">
        <h2 className="section-title">Preferences</h2>
        
        <div className="form-group">
          <label>Food Preferences</label>
          <div className="checkbox-group">
            {foodOptions.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.foodPreferences.includes(option)}
                  onChange={() => handleCheckboxChange('foodPreferences', option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Stay Preferences</label>
          <div className="checkbox-group">
            {stayOptions.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.stayPreferences.includes(option)}
                  onChange={() => handleCheckboxChange('stayPreferences', option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Information */}
      <section className="form-section">
        <h2 className="section-title">Additional Information</h2>
        
        <div className="form-group">
          <label htmlFor="sightseeing">Sightseeing Preferences</label>
          <textarea
            id="sightseeing"
            name="sightseeing"
            value={formData.sightseeing}
            onChange={handleInputChange}
            rows="4"
            placeholder="List any specific places, landmarks, or activities you'd like to include..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="permissions">Required Permissions/Documents</label>
          <textarea
            id="permissions"
            name="permissions"
            value={formData.permissions}
            onChange={handleInputChange}
            rows="3"
            placeholder="Visa requirements, travel insurance, vaccination certificates, etc."
          />
        </div>

        <div className="form-group">
          <label htmlFor="specialRequests">Special Requests or Notes</label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleInputChange}
            rows="4"
            placeholder="Any additional information, special requirements, or preferences..."
          />
        </div>
      </section>

      {/* Submit Button */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Itinerary Request'}
        </button>
      </div>
    </form>
  );
};

export default ItineraryForm;

