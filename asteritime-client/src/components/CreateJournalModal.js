import React, { useState, useEffect } from 'react';
import { createJournalEntry, updateJournalEntry } from '../api/journal';
import { getTodayLocalDateString } from '../utils/dateUtils';
import './CreateJournalModal.css';

function CreateJournalModal({ isOpen, onClose, onSuccess, entry, defaultDate }) {
  const [formData, setFormData] = useState({
    date: defaultDate || getTodayLocalDateString(),
    title: '',
    contentText: '',
    imageUrls: '',
    weather: '',
    mood: '',
    activity: '',
    voiceNoteUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUrlsArray, setImageUrlsArray] = useState([]);

  // When editing, populate form data
  useEffect(() => {
    if (entry) {
      // Parse image URLs
      let images = [];
      if (entry.imageUrls) {
        try {
          images = JSON.parse(entry.imageUrls);
        } catch {
          images = [];
        }
      }

      setFormData({
        date: entry.date || defaultDate || getTodayLocalDateString(),
        title: entry.title || '',
        contentText: entry.contentText || '',
        imageUrls: entry.imageUrls || '',
        weather: entry.weather || '',
        mood: entry.mood || '',
        activity: entry.activity || '',
        voiceNoteUrl: entry.voiceNoteUrl || '',
      });
      setImageUrlsArray(images);
    } else {
      // Reset form when creating new
      setFormData({
        date: defaultDate || getTodayLocalDateString(),
        title: '',
        contentText: '',
        imageUrls: '',
        weather: '',
        mood: '',
        activity: '',
        voiceNoteUrl: '',
      });
      setImageUrlsArray([]);
    }
    setError('');
  }, [entry, defaultDate, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUrlAdd = () => {
    const url = prompt('Please enter image URL:');
    if (url && url.trim()) {
      const newArray = [...imageUrlsArray, url.trim()];
      setImageUrlsArray(newArray);
      setFormData((prev) => ({
        ...prev,
        imageUrls: JSON.stringify(newArray),
      }));
    }
  };

  const handleImageUrlRemove = (index) => {
    const newArray = imageUrlsArray.filter((_, i) => i !== index);
    setImageUrlsArray(newArray);
    setFormData((prev) => ({
      ...prev,
      imageUrls: newArray.length > 0 ? JSON.stringify(newArray) : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data
      const journalData = {
        date: formData.date,
      };

      if (entry) {
        // Update: send all fields, including empty strings (to clear fields)
        journalData.title = formData.title || null;
        journalData.contentText = formData.contentText || null;
        journalData.imageUrls = formData.imageUrls || null;
        journalData.weather = formData.weather || null;
        journalData.mood = formData.mood || null;
        journalData.activity = formData.activity || null;
        journalData.voiceNoteUrl = formData.voiceNoteUrl || null;
        
        await updateJournalEntry(entry.id, journalData);
      } else {
        // Create: only add non-empty fields
        if (formData.title) journalData.title = formData.title;
        if (formData.contentText) journalData.contentText = formData.contentText;
        if (formData.imageUrls) journalData.imageUrls = formData.imageUrls;
        if (formData.weather) journalData.weather = formData.weather;
        if (formData.mood) journalData.mood = formData.mood;
        if (formData.activity) journalData.activity = formData.activity;
        if (formData.voiceNoteUrl) journalData.voiceNoteUrl = formData.voiceNoteUrl;
        
        await createJournalEntry(journalData);
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save journal entry:', err);
      setError(err.message || 'Failed to save journal entry, please try again');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content journal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{entry ? 'Edit Journal' : 'New Journal'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              lang="en"
            />
          </div>

          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Give this journal entry a title..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="contentText">Content</label>
            <textarea
              id="contentText"
              name="contentText"
              value={formData.contentText}
              onChange={handleChange}
              placeholder="Record what happened today..."
              rows={8}
            />
          </div>

          {/* Category tags */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weather">Weather</label>
              <input
                type="text"
                id="weather"
                name="weather"
                value={formData.weather}
                onChange={handleChange}
                placeholder="e.g., Sunny, Rainy"
              />
            </div>

            <div className="form-group">
              <label htmlFor="mood">Mood</label>
              <input
                type="text"
                id="mood"
                name="mood"
                value={formData.mood}
                onChange={handleChange}
                placeholder="e.g., Happy, Calm"
              />
            </div>

            <div className="form-group">
              <label htmlFor="activity">Activity</label>
              <input
                type="text"
                id="activity"
                name="activity"
                value={formData.activity}
                onChange={handleChange}
                placeholder="e.g., Work, Study"
              />
            </div>
          </div>

          {/* Images */}
          <div className="form-group">
            <label>Images</label>
            <div className="image-urls-section">
              {imageUrlsArray.map((url, index) => (
                <div key={index} className="image-url-item">
                  <img src={url} alt={`Preview ${index + 1}`} className="image-preview" />
                  <span className="image-url-text" title={url}>
                    {url.length > 40 ? url.substring(0, 40) + '...' : url}
                  </span>
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => handleImageUrlRemove(index)}
                  >
                    Delete
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-add-image"
                onClick={handleImageUrlAdd}
              >
                + Add Image URL
              </button>
            </div>
          </div>

          {/* Voice */}
          <div className="form-group">
            <label htmlFor="voiceNoteUrl">Voice Note URL</label>
            <input
              type="url"
              id="voiceNoteUrl"
              name="voiceNoteUrl"
              value={formData.voiceNoteUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
            {formData.voiceNoteUrl && (
              <div className="voice-preview">
                <audio controls src={formData.voiceNoteUrl}>
                  Your browser does not support audio playback
                </audio>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : entry ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateJournalModal;
