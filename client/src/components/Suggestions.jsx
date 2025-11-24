import React, { useMemo } from 'react';
import './Suggestions.css';

const formatDistance = (meters) => {
  if (!meters && meters !== 0) return '';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

const formatPrice = (attraction) => {
  if (attraction.priceLocal && attraction.currency) {
    if (attraction.priceUSD) {
      return `~ ${attraction.currency} ${attraction.priceLocal} (≈ USD ${attraction.priceUSD})`;
    }
    return `~ ${attraction.currency} ${attraction.priceLocal}`;
  }
  if (attraction.priceUSD) {
    return `~ USD ${attraction.priceUSD}`;
  }
  return 'Price to be confirmed';
};

const buildAttractionMap = (suggestions) => {
  const map = {};
  suggestions.forEach((suggestion) => {
    if (suggestion.status !== 'ok') return;
    (suggestion.attractions || []).forEach((attraction) => {
      const key = `${suggestion.destinationLabel}__${attraction.title}`;
      map[key] = { ...attraction, destinationLabel: suggestion.destinationLabel };
    });
  });
  return map;
};

const Suggestions = ({ submission, selections, onToggleExperience, onReset }) => {
  const { id, suggestions = [], formSnapshot } = submission;
  const safeSelections = selections || {};
  const totalSelected = Object.values(safeSelections).reduce((acc, items) => acc + items.length, 0);
  const attractionMap = useMemo(() => buildAttractionMap(suggestions), [suggestions]);

  const selectedDetails = Object.entries(safeSelections).flatMap(([destination, items]) =>
    items.map((title) => {
      const detail = attractionMap[`${destination}__${title}`];
      return {
        destination,
        title,
        priceUSD: detail?.priceUSD ?? null,
        priceLocal: detail?.priceLocal ?? null,
        currency: detail?.currency ?? null,
      };
    })
  );

  const subtotalUSD = selectedDetails.reduce((sum, item) => sum + (item.priceUSD || 0), 0);

  return (
    <div className="suggestions-wrapper">
      <div className="suggestions-header">
        <h2>Nearby highlights for your trip</h2>
        <p>
          We looked up real places around each destination you entered. Select the sights you care about or fine-tune the
          destinations and submit again.
        </p>
        <div className="request-meta">
          <span>Request ID #{id}</span>
          {formSnapshot?.destinations?.length ? (
            <span>
              Destinations:{' '}
              {formSnapshot.destinations.map((dest, index) => (
                <strong key={dest}>
                  {dest}
                  {index < formSnapshot.destinations.length - 1 ? ', ' : ''}
                </strong>
              ))}
            </span>
          ) : null}
          {formSnapshot?.days ? <span>{formSnapshot.days} day outline</span> : null}
        </div>
      </div>

      {suggestions.length ? (
        <div className="suggestion-grid">
          {suggestions.map((item) => {
            const currentSelections = safeSelections[item.destinationLabel] || [];

            if (item.status !== 'ok') {
              return (
                <article className={`suggestion-card status-${item.status}`} key={item.destinationLabel}>
                  <div className="suggestion-body">
                    <div className="card-title single">
                      <div>
                        <h3>{item.destinationLabel}</h3>
                        <p>{item.message || 'No data available right now.'}</p>
                      </div>
                    </div>
                    <div className="status-note">
                      {item.status === 'not_found'
                        ? 'Please double-check the spelling or try a nearby city.'
                        : 'We will still craft a custom plan and follow up with you shortly.'}
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article className="suggestion-card" key={item.destinationLabel}>
                <div className="suggestion-body">
                  <div className="card-title">
                    <div>
                      <h3>{item.exactName}</h3>
                      <p>
                        Entered as <strong>{item.destinationLabel}</strong> • {item.country}
                      </p>
                    </div>
                    <div className="location-meta">
                      <span>
                        {item.coordinates.lat.toFixed(3)}, {item.coordinates.lon.toFixed(3)}
                      </span>
                      <a href={item.mapUrl} target="_blank" rel="noreferrer">
                        View map
                      </a>
                    </div>
                  </div>

                  <div className="attraction-list">
                    <p className="attraction-label">
                      {item.attractions.length
                        ? 'Pick the attractions that excite you'
                        : 'No well-known places detected within 15 km'}
                    </p>
                    {item.attractions.map((attraction) => {
                      const isChecked = currentSelections.includes(attraction.title);
                      return (
                        <label className={`attraction-option ${isChecked ? 'checked' : ''}`} key={attraction.pageId}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleExperience(item.destinationLabel, attraction.title)}
                          />
                          <div>
                            <strong>{attraction.title}</strong>
                            <div className="attraction-meta">
                              {attraction.duration && <span>{attraction.duration}</span>}
                              {attraction.category && <span>{attraction.category}</span>}
                              {attraction.distance && <span>{formatDistance(attraction.distance)} away</span>}
                            </div>
                            <div className="price-line">{formatPrice(attraction)}</div>
                            {attraction.description && (
                              <p className="attraction-description">{attraction.description}</p>
                            )}
                            {attraction.pageUrl && (
                              <a href={attraction.pageUrl} target="_blank" rel="noreferrer">
                                Learn more
                              </a>
                            )}
                          </div>
                        </label>
                      );
                    })}
                    {item.notes && <p className="attraction-note">{item.notes}</p>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="suggestions-empty">
          <h3>No quick picks yet</h3>
          <p>
            We could not fetch live data for the selected destinations, but our travel desk will craft something unique
            and reach out shortly.
          </p>
        </div>
      )}

      <div className="selections-summary">
        <div>
          <h4>Your shortlist</h4>
          {totalSelected ? (
            <>
              <ul>
                {selectedDetails.map((item) => (
                  <li key={`${item.destination}-${item.title}`}>
                    <span>{item.destination}</span>
                    <strong>{item.title}</strong>
                    {item.priceUSD || item.priceLocal ? (
                      <em>
                        {item.priceLocal && item.currency
                          ? `${item.currency} ${item.priceLocal}`
                          : item.priceUSD
                          ? `USD ${item.priceUSD}`
                          : ''}
                      </em>
                    ) : null}
                  </li>
                ))}
              </ul>
              {subtotalUSD > 0 && (
                <div className="subtotal-pill">
                  Estimated shortlist subtotal ≈ USD {subtotalUSD.toFixed(0)}
                </div>
              )}
            </>
          ) : (
            <p>Select at least one attraction so we know the vibe you’re after.</p>
          )}
        </div>
        <div className="summary-actions">
          <button className="btn btn-secondary" onClick={onReset}>
            Plan another trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default Suggestions;

