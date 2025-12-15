import React, { useState, useEffect } from 'react';
import {
  getAllJournalEntries,
  getJournalEntriesByDate,
  deleteJournalEntry,
  getJournalEntryById,
} from '../api/journal';
import CreateJournalModal from './CreateJournalModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { getTodayLocalDateString, formatLocalDateDisplay, parseLocalDate, formatLocalTime, getCurrentTimezone } from '../utils/dateUtils';
import './Journal.css';

function Journal() {
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDateString());
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  // New: View state - 'list' shows list, 'detail' shows detail
  const [viewMode, setViewMode] = useState('list');
  // New: Currently viewed journal detail
  const [viewingEntry, setViewingEntry] = useState(null);

  // Load data
  useEffect(() => {
    loadEntries();
  }, []);

  // When selected date changes, load journal entries for that day and switch to list view
  useEffect(() => {
    if (selectedDate) {
      loadEntriesByDate(selectedDate);
      setViewMode('list'); // Return to list view when date changes
      setViewingEntry(null); // Clear detail
    }
  }, [selectedDate]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllJournalEntries();
      // Filter out auto-created statistics records
      const filteredData = (Array.isArray(data) ? data : []).filter(
        entry => !isAutoCreatedStatsEntry(entry)
      );
      setAllEntries(filteredData);
      // If a date is selected, load journal entries for that day
      if (selectedDate) {
        const dayEntries = filteredData.filter(
          (entry) => entry.date === selectedDate
        );
        setEntries(dayEntries);
      }
    } catch (err) {
      console.error('Failed to load journal entries:', err);
      const errorMsg = err.message || 'Failed to load journal entries, please refresh and try again';
      setError(errorMsg);
      
      // If 401 error, prompt to re-login
      if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
        setTimeout(() => {
          if (window.confirm('Login has expired, would you like to login again?')) {
            window.location.href = '/login';
          }
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEntriesByDate = async (date) => {
    try {
      setLoading(true);
      setError('');
      const data = await getJournalEntriesByDate(date);
      console.log('Loaded entries for date', date, ':', data);
      // Filter out auto-created statistics records (only focus time, no other content)
      const filteredData = (Array.isArray(data) ? data : []).filter(
        entry => !isAutoCreatedStatsEntry(entry)
      );
      setEntries(filteredData);
    } catch (err) {
      console.error('Failed to load journal entries:', err);
      const errorMsg = err.message || 'Failed to load journal entries, please refresh and try again';
      setError(errorMsg);
      
      // If 401 error, prompt to re-login
      if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
        setTimeout(() => {
          if (window.confirm('Login has expired, would you like to login again?')) {
            window.location.href = '/login';
          }
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleCreateClick = () => {
    setSelectedEntry(null);
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (entry) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (entry) => {
    setSelectedEntry(entry);
    setIsDeleteModalOpen(true);
  };

  // Click journal entry to show detail
  const handleEntryClick = (entry) => {
    setViewingEntry(entry);
    setViewMode('detail');
  };

  // Return to list view
  const handleBackToList = () => {
    setViewMode('list');
    setViewingEntry(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEntry) return;

    try {
      await deleteJournalEntry(selectedEntry.id);
      setIsDeleteModalOpen(false);
      setSelectedEntry(null);
      // If viewing detail and deleted entry is the currently viewed entry, return to list
      if (viewMode === 'detail' && viewingEntry && viewingEntry.id === selectedEntry.id) {
        setViewMode('list');
        setViewingEntry(null);
      }
      // Reload data
      if (selectedDate) {
        await loadEntriesByDate(selectedDate);
      }
      await loadEntries();
    } catch (err) {
      console.error('Failed to delete journal entry:', err);
      setError('Failed to delete journal entry, please try again');
    }
  };

  const handleModalSuccess = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedEntry(null);
    // Reload data
    if (selectedDate) {
      loadEntriesByDate(selectedDate);
    }
    loadEntries();
    // If viewing detail, refresh detail data
    if (viewMode === 'detail' && viewingEntry) {
      // Reload the entry
      getJournalEntriesByDate(selectedDate).then(data => {
        const updatedEntry = data.find(e => e.id === viewingEntry.id);
        if (updatedEntry) {
          setViewingEntry(updatedEntry);
        }
      });
    }
  };

  const handlePreviousDay = () => {
    const date = parseLocalDate(selectedDate);
    date.setDate(date.getDate() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const date = parseLocalDate(selectedDate);
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleToday = () => {
    setSelectedDate(getTodayLocalDateString());
  };

  // Parse image URLs (JSON format)
  const parseImageUrls = (imageUrls) => {
    if (!imageUrls) return [];
    try {
      return JSON.parse(imageUrls);
    } catch {
      return [];
    }
  };

  // Check if there are journal entries on a specific date (excluding auto-created statistics records)
  const hasEntriesOnDate = (date) => {
    return allEntries.some((entry) => 
      entry.date === date && !isAutoCreatedStatsEntry(entry)
    );
  };

  // Check if it's an auto-created statistics record (only totalFocusMinutes, no other content)
  const isAutoCreatedStatsEntry = (entry) => {
    return !entry.title && 
           !entry.contentText && 
           !entry.evaluation && 
           !entry.imageUrls && 
           !entry.voiceNoteUrl &&
           !entry.weather && 
           !entry.mood && 
           !entry.activity &&
           (entry.totalFocusMinutes > 0);
  };

  // Get list of dates with journal entries (excluding auto-created statistics records)
  const getDatesWithEntries = () => {
    const dates = new Set();
    allEntries.forEach((entry) => {
      // Only include journal entries with actual content, exclude auto-created statistics records
      if (!isAutoCreatedStatsEntry(entry)) {
        dates.add(entry.date);
      }
    });
    return Array.from(dates).sort().reverse();
  };

  if (loading && entries.length === 0) {
    return (
      <div className="page-content">
        <div className="journal-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="journal-container">
        <div className="journal-header">
          <div>
            <h1>Journal</h1>
            <div className="timezone-info" title="Current timezone">
              Timezone: {getCurrentTimezone()}
            </div>
          </div>
          <button className="btn-create" onClick={handleCreateClick}>
            + New Entry
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Date selector */}
        <div className="date-selector">
          <button className="btn-nav" onClick={handlePreviousDay}>
            ←
          </button>
          <div className="date-display">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="date-input"
              lang="en"
            />
            <span className="date-text">{formatLocalDateDisplay(selectedDate)}</span>
            <button className="btn-today" onClick={handleToday}>
              Today
            </button>
          </div>
          <button className="btn-nav" onClick={handleNextDay}>
            →
          </button>
        </div>

        {/* Display different content based on view mode */}
        {viewMode === 'list' ? (
          /* List view: show all journals for that day */
          <div className="journal-list-view">
            <div className="list-header">
              <h2>Journal for {formatLocalDateDisplay(selectedDate)}</h2>
              <span className="entry-count">{entries.length} entries</span>
            </div>
            
            {entries.length === 0 ? (
              <div className="empty-state">
                <p>No journal entries for this day yet</p>
                <button className="btn-create-small" onClick={handleCreateClick}>
                  Create First Entry
                </button>
              </div>
            ) : (
              <div className="journal-list">
                {entries.map((entry) => {
                  // Debug: print entry data
                  console.log('Journal Entry:', entry);
                  
                  const preview = entry.contentText 
                    ? (entry.contentText.length > 100 
                        ? entry.contentText.substring(0, 100) + '...' 
                        : entry.contentText)
                    : (entry.evaluation 
                        ? (entry.evaluation.length > 100 
                            ? entry.evaluation.substring(0, 100) + '...' 
                            : entry.evaluation)
                        : 'No content');
                  
                  return (
                    <div 
                      key={entry.id} 
                      className="journal-list-item"
                      onClick={() => handleEntryClick(entry)}
                    >
                      <div className="list-item-header">
                        <div className="list-item-title">
                          {entry.title || 'No Title'}
                        </div>
                        <div className="list-item-time">
                          {formatLocalTime(entry.createdAt)}
                        </div>
                      </div>
                      
                      {/* Tag preview */}
                      {(entry.weather || entry.mood || entry.activity) && (
                        <div className="list-item-tags">
                          {entry.weather && (
                            <span className="tag tag-weather">{entry.weather}</span>
                          )}
                          {entry.mood && (
                            <span className="tag tag-mood">{entry.mood}</span>
                          )}
                          {entry.activity && (
                            <span className="tag tag-activity">{entry.activity}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Content preview */}
                      <div className="list-item-preview">
                        {preview}
                      </div>
                      
                      {/* Icon hints */}
                      <div className="list-item-icons">
                        {entry.imageUrls && parseImageUrls(entry.imageUrls).length > 0 && (
                          <span className="icon-hint" title="Contains images">📷</span>
                        )}
                        {entry.voiceNoteUrl && (
                          <span className="icon-hint" title="Contains voice">🎤</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Detail view: show full content of a single journal */
          viewingEntry && (
            <div className="journal-detail-view">
              <div className="detail-header">
                <button className="btn-back" onClick={handleBackToList}>
                  ← Back to List
                </button>
                <div className="detail-title-section">
                  <h2>{viewingEntry.title || 'No Title'}</h2>
                  <div className="detail-meta">
                    <span className="detail-date">{formatLocalDateDisplay(viewingEntry.date)}</span>
                    <span className="detail-time">{formatLocalTime(viewingEntry.createdAt)}</span>
                  </div>
                </div>
                <div className="detail-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEditClick(viewingEntry)}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteClick(viewingEntry)}
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Category tags */}
              {(viewingEntry.weather || viewingEntry.mood || viewingEntry.activity) && (
                <div className="entry-tags">
                  {viewingEntry.weather && (
                    <span className="tag tag-weather">Weather: {viewingEntry.weather}</span>
                  )}
                  {viewingEntry.mood && (
                    <span className="tag tag-mood">Mood: {viewingEntry.mood}</span>
                  )}
                  {viewingEntry.activity && (
                    <span className="tag tag-activity">Activity: {viewingEntry.activity}</span>
                  )}
                </div>
              )}

              {/* Text content */}
              {viewingEntry.contentText && (
                <div className="entry-content">
                  <p>{viewingEntry.contentText}</p>
                </div>
              )}

              {/* Images */}
              {viewingEntry.imageUrls && parseImageUrls(viewingEntry.imageUrls).length > 0 && (
                <div className="entry-images">
                  {parseImageUrls(viewingEntry.imageUrls).map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Journal image ${index + 1}`}
                      className="entry-image"
                    />
                  ))}
                </div>
              )}

              {/* Voice */}
              {viewingEntry.voiceNoteUrl && (
                <div className="entry-voice">
                  <audio controls src={viewingEntry.voiceNoteUrl}>
                    Your browser does not support audio playback
                  </audio>
                </div>
              )}

              {/* Evaluation (backward compatibility) */}
              {viewingEntry.evaluation && (
                <div className="entry-evaluation">
                  <p className="evaluation-label">Evaluation:</p>
                  <p>{viewingEntry.evaluation}</p>
                </div>
              )}

              {/* If no content, show hint */}
              {!viewingEntry.contentText && !viewingEntry.evaluation && 
               !viewingEntry.imageUrls && !viewingEntry.voiceNoteUrl && (
                <div className="entry-empty-content">
                  <p className="empty-content-hint">This journal entry has no content yet, click "Edit" to add content</p>
                </div>
              )}
            </div>
          )
        )}

        {/* List of dates with journal entries (sidebar or bottom) */}
        {allEntries.length > 0 && (
          <div className="dates-with-entries">
            <h3>Dates with Entries</h3>
            <div className="dates-list">
                  {getDatesWithEntries().slice(0, 10).map((date) => (
                <button
                  key={date}
                  className={`date-item ${date === selectedDate ? 'active' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  {formatLocalDateDisplay(date)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <CreateJournalModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedEntry(null);
        }}
        onSuccess={handleModalSuccess}
        entry={selectedEntry}
        defaultDate={selectedDate}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedEntry(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Confirm Delete"
        message={`Are you sure you want to delete this journal entry "${selectedEntry?.title || 'No Title'}"? This action cannot be undone.`}
      />
    </div>
  );
}

export default Journal;
