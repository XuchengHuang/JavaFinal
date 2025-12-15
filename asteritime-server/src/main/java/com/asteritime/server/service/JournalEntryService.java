package com.asteritime.server.service;

import com.asteritime.common.model.JournalEntry;
import com.asteritime.common.model.User;
import com.asteritime.server.repository.JournalEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(isolation = Isolation.READ_COMMITTED)
public class JournalEntryService {

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    /**
     * Create a new journal entry
     */
    public JournalEntry createJournalEntry(Long userId, JournalEntry journalEntry) {
        User user = new User();
        user.setId(userId);
        journalEntry.setUser(user);
        
        if (journalEntry.getDate() == null) {
            journalEntry.setDate(LocalDate.now());
        }
        
        if (journalEntry.getTotalFocusMinutes() == null) {
            journalEntry.setTotalFocusMinutes(0);
        }
        
        return journalEntryRepository.save(journalEntry);
    }

    /**
     * Find journal entry by ID
     */
    public Optional<JournalEntry> findById(Long id) {
        return journalEntryRepository.findByIdWithUser(id);
    }

    /**
     * Find all journal entries for a user on a specific date (ordered by creation time desc)
     */
    public List<JournalEntry> findByUserAndDate(Long userId, LocalDate date) {
        return journalEntryRepository.findByUser_IdAndDateOrderByCreatedAtDesc(userId, date);
    }

    /**
     * Find all journal entries for a user (ordered by date desc, newest first)
     */
    public List<JournalEntry> findAllByUserId(Long userId) {
        return journalEntryRepository.findByUser_IdOrderByDateDescCreatedAtDesc(userId);
    }

    /**
     * Find all journal entries for a user within a date range
     */
    public List<JournalEntry> findByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return journalEntryRepository.findByUser_IdAndDateBetweenOrderByDateDescCreatedAtDesc(
                userId, startDate, endDate);
    }

    /**
     * Update journal entry (only own entries)
     * Uses optimistic locking to prevent concurrent update conflicts
     * 
     * @throws OptimisticLockingFailureException if concurrent update conflict occurs
     */
    @Retryable(value = {OptimisticLockingFailureException.class}, maxAttempts = 3, backoff = @Backoff(delay = 100))
    public Optional<JournalEntry> updateJournalEntry(Long userId, Long entryId, JournalEntry updatedEntry) {
        try {
            Optional<JournalEntry> optionalEntry = journalEntryRepository.findByIdWithUser(entryId);
            
            if (!optionalEntry.isPresent()) {
                System.out.println("Journal entry not found: " + entryId);
                return Optional.empty();
            }
            
            JournalEntry entry = optionalEntry.get();
            System.out.println("Found journal entry: " + entry.getId() + ", User: " + (entry.getUser() != null ? entry.getUser().getId() : "null"));
            
            if (entry.getUser() == null) {
                System.err.println("Journal entry missing user info: " + entryId);
                throw new IllegalStateException("Journal entry missing user information");
            }
            if (!entry.getUser().getId().equals(userId)) {
                System.err.println("User ID mismatch - Requested user: " + userId + ", Entry owner: " + entry.getUser().getId());
                throw new IllegalArgumentException("Not authorized to modify other user's journal");
            }
            if (updatedEntry.getTitle() != null) {
                String title = updatedEntry.getTitle().trim();
                entry.setTitle(title.isEmpty() ? null : title);
            }
            if (updatedEntry.getContentText() != null) {
                String contentText = updatedEntry.getContentText().trim();
                entry.setContentText(contentText.isEmpty() ? null : contentText);
            }
            if (updatedEntry.getImageUrls() != null) {
                String imageUrls = updatedEntry.getImageUrls().trim();
                entry.setImageUrls(imageUrls.isEmpty() ? null : imageUrls);
            }
            if (updatedEntry.getWeather() != null) {
                String weather = updatedEntry.getWeather().trim();
                entry.setWeather(weather.isEmpty() ? null : weather);
            }
            if (updatedEntry.getMood() != null) {
                String mood = updatedEntry.getMood().trim();
                entry.setMood(mood.isEmpty() ? null : mood);
            }
            if (updatedEntry.getActivity() != null) {
                String activity = updatedEntry.getActivity().trim();
                entry.setActivity(activity.isEmpty() ? null : activity);
            }
            if (updatedEntry.getVoiceNoteUrl() != null) {
                String voiceNoteUrl = updatedEntry.getVoiceNoteUrl().trim();
                entry.setVoiceNoteUrl(voiceNoteUrl.isEmpty() ? null : voiceNoteUrl);
            }
            if (updatedEntry.getEvaluation() != null) {
                String evaluation = updatedEntry.getEvaluation().trim();
                entry.setEvaluation(evaluation.isEmpty() ? null : evaluation);
            }
            if (updatedEntry.getDate() != null) {
                entry.setDate(updatedEntry.getDate());
            }
            if (updatedEntry.getTotalFocusMinutes() != null) {
                entry.setTotalFocusMinutes(updatedEntry.getTotalFocusMinutes());
            }
            
            if (updatedEntry.getVersion() != null) {
                entry.setVersion(updatedEntry.getVersion());
            }
            
            System.out.println("Saving journal entry: " + entry.getId());
            try {
                JournalEntry saved = journalEntryRepository.save(entry);
                System.out.println("Saved successfully: " + saved.getId());
                return Optional.of(saved);
            } catch (OptimisticLockingFailureException e) {
                throw new OptimisticLockingFailureException("Journal entry has been modified by another operation, please refresh and retry", e);
            }
            
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Unknown error updating journal entry: " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getName());
            e.printStackTrace();
            throw new RuntimeException("Failed to update journal: " + e.getMessage(), e);
        }
    }

    /**
     * Delete journal entry (only own entries)
     */
    public boolean deleteJournalEntry(Long userId, Long entryId) {
        Optional<JournalEntry> optionalEntry = journalEntryRepository.findById(entryId);
        
        if (!optionalEntry.isPresent()) {
            return false;
        }
        
        JournalEntry entry = optionalEntry.get();
        
        if (!entry.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to delete other user's journal");
        }
        
        journalEntryRepository.delete(entry);
        return true;
    }

    /**
     * Get or create journal entry for a user on a specific date (totalFocusMinutes initialized to 0)
     * Note: Multiple journals per day are allowed, this method returns the first created entry or creates a new one
     */
    public JournalEntry getOrCreateEntry(Long userId, LocalDate date) {
        List<JournalEntry> entries = journalEntryRepository.findByUser_IdAndDateOrderByCreatedAtDesc(userId, date);
        
        if (!entries.isEmpty()) {
            return entries.get(entries.size() - 1);
        }

        JournalEntry entry = new JournalEntry();
        entry.setDate(date);
        entry.setTotalFocusMinutes(0);

        User user = new User();
        user.setId(userId);
        entry.setUser(user);

        return journalEntryRepository.save(entry);
    }

    /**
     * Add focus minutes for a user on a specific date
     * Note: Only adds to existing entries, creates minimal record if no entry exists
     * Uses optimistic locking to prevent concurrent update conflicts
     */
    @Retryable(value = {OptimisticLockingFailureException.class}, maxAttempts = 3, backoff = @Backoff(delay = 100))
    public JournalEntry addFocusMinutes(Long userId, LocalDate date, int focusMinutes) {
        List<JournalEntry> entries = journalEntryRepository.findByUser_IdAndDateOrderByCreatedAtDesc(userId, date);

        JournalEntry entry;
        if (entries.isEmpty()) {
            entry = new JournalEntry();
            entry.setDate(date);
            entry.setTotalFocusMinutes(focusMinutes);

            User user = new User();
            user.setId(userId);
            entry.setUser(user);
            
            return journalEntryRepository.save(entry);
        } else {
            entry = entries.get(entries.size() - 1);
            int current = Optional.ofNullable(entry.getTotalFocusMinutes()).orElse(0);
            entry.setTotalFocusMinutes(current + focusMinutes);
            try {
                return journalEntryRepository.save(entry);
            } catch (OptimisticLockingFailureException e) {
                throw e;
            }
        }
    }

    /**
     * Get total focus minutes for a specific date (sum of all journal entries for that day)
     */
    public int getTotalFocusMinutes(Long userId, LocalDate date) {
        List<JournalEntry> entries = journalEntryRepository.findByUser_IdAndDateOrderByCreatedAtDesc(userId, date);
        return entries.stream()
                .mapToInt(e -> Optional.ofNullable(e.getTotalFocusMinutes()).orElse(0))
                .sum();
    }

    /**
     * Update or insert evaluation text for a specific date
     * Note: Updates the earliest created entry for that day, or creates a new entry
     */
    public JournalEntry upsertEvaluation(Long userId, LocalDate date, String evaluation) {
        JournalEntry entry = getOrCreateEntry(userId, date);
        entry.setEvaluation(evaluation);
        return journalEntryRepository.save(entry);
    }
}


