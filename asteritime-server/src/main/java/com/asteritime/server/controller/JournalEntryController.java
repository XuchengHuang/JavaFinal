package com.asteritime.server.controller;

import com.asteritime.common.model.JournalEntry;
import com.asteritime.server.service.JournalEntryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Journal entry REST API endpoints
 * 
 * Features:
 *   - Create, query, update, delete journal entries
 *   - View entries by date (supports multiple entries per day)
 *   - Get all logs for current user
 *   - Accumulate focus time after Pomodoro timer ends
 */
@RestController
@RequestMapping("/journal-entries")
public class JournalEntryController {

    @Autowired
    private JournalEntryService journalEntryService;

    /**
     * Create a new journal entry
     * 
     * Example:
     *   POST /api/journal-entries
     *   Header: Authorization: Bearer <token>
     *   Body: {
     *     "date": "2025-12-09",
     *     "title": "Today's mood",
     *     "contentText": "Had a fulfilling day...",
     *     "imageUrls": "[\"url1\", \"url2\"]",
     *     "weather": "Sunny",
     *     "mood": "Happy",
     *     "activity": "Work",
     *     "voiceNoteUrl": "https://..."
     *   }
     */
    @PostMapping
    public ResponseEntity<JournalEntry> createJournalEntry(HttpServletRequest request,
                                                           @RequestBody JournalEntry journalEntry) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        JournalEntry created = journalEntryService.createJournalEntry(userId, journalEntry);
        return ResponseEntity.ok(created);
    }

    /**
     * Get journal entry by ID
     * 
     * Example:
     *   GET /api/journal-entries/{id}
     *   Header: Authorization: Bearer <token>
     */
    @GetMapping("/{id}")
    public ResponseEntity<JournalEntry> getJournalEntryById(HttpServletRequest request,
                                                             @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        return journalEntryService.findById(id)
                .map(entry -> {
                    if (!entry.getUser().getId().equals(userId)) {
                        return ResponseEntity.status(403).<JournalEntry>build();
                    }
                    return ResponseEntity.ok(entry);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all journal entries for current user (ordered by date desc, newest first)
     * 
     * Note: userId is automatically extracted from token
     * 
     * Example:
     *   GET /api/journal-entries
     *   Header: Authorization: Bearer <token>
     */
    @GetMapping
    public ResponseEntity<List<JournalEntry>> getAllEntries(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<JournalEntry> entries = journalEntryService.findAllByUserId(userId);
        return ResponseEntity.ok(entries);
    }

    /**
     * Get journal entries by date (returns all entries for that day, ordered by creation time desc)
     * 
     * Example:
     *   GET /api/journal-entries/by-date?date=2025-12-09
     *   Header: Authorization: Bearer <token>
     */
    @GetMapping("/by-date")
    public ResponseEntity<List<JournalEntry>> getEntriesByDate(HttpServletRequest request,
                                                               @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        if (date == null) {
            return ResponseEntity.badRequest().build();
        }

        List<JournalEntry> entries = journalEntryService.findByUserAndDate(userId, date);
        return ResponseEntity.ok(entries);
    }

    /**
     * Get journal entries by date range
     * 
     * Example:
     *   GET /api/journal-entries/by-date-range?startDate=2025-12-01&endDate=2025-12-31
     *   Header: Authorization: Bearer <token>
     */
    @GetMapping("/by-date-range")
    public ResponseEntity<List<JournalEntry>> getEntriesByDateRange(HttpServletRequest request,
                                                                     @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                                     @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        if (startDate == null || endDate == null) {
            return ResponseEntity.badRequest().build();
        }

        List<JournalEntry> entries = journalEntryService.findByUserAndDateRange(userId, startDate, endDate);
        return ResponseEntity.ok(entries);
    }

    /**
     * Update journal entry
     * 
     * Example:
     *   PUT /api/journal-entries/{id}
     *   Header: Authorization: Bearer <token>
     *   Body: {
     *     "title": "Updated title",
     *     "contentText": "Updated content...",
     *     ...
     *   }
     */
    @PutMapping("/{id}")
    public ResponseEntity<JournalEntry> updateJournalEntry(HttpServletRequest request,
                                                            @PathVariable Long id,
                                                            @RequestBody JournalEntry updatedEntry) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            System.out.println("Update journal request - userId: " + userId + ", entryId: " + id);
            System.out.println("Update data: " + updatedEntry);
            
            Optional<JournalEntry> result = journalEntryService.updateJournalEntry(userId, id, updatedEntry);
            
            if (result.isPresent()) {
                System.out.println("Update successful: " + result.get());
                return ResponseEntity.ok(result.get());
            } else {
                System.out.println("Journal entry not found: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (org.springframework.dao.OptimisticLockingFailureException e) {
            System.err.println("Concurrent update conflict: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .header("X-Error-Message", "Journal entry has been modified by another operation, please refresh and retry")
                    .build();
        } catch (IllegalArgumentException e) {
            System.err.println("Authorization error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(403).build();
        } catch (IllegalStateException e) {
            System.err.println("State error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        } catch (Exception e) {
            System.err.println("Failed to update journal: " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getName());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Delete journal entry
     * 
     * Example:
     *   DELETE /api/journal-entries/{id}
     *   Header: Authorization: Bearer <token>
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJournalEntry(HttpServletRequest request,
                                                   @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            boolean deleted = journalEntryService.deleteJournalEntry(userId, id);
            return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).build();
        }
    }

    /**
     * Initialize or get today's journal entry
     * 
     * Call once when user opens the app or after login.
     * Creates a new entry with totalFocusMinutes=0 if none exists, otherwise returns existing entry.
     * 
     * Note: userId is automatically extracted from token
     * 
     * Example:
     *   GET /api/journal-entries/today
     *   Header: Authorization: Bearer <token>
     */
    @GetMapping("/today")
    public ResponseEntity<JournalEntry> getOrCreateToday(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        LocalDate today = LocalDate.now();
        JournalEntry entry = journalEntryService.getOrCreateEntry(userId, today);
        return ResponseEntity.ok(entry);
    }

    /**
     * Get total focus minutes for a specific date
     * 
     * Note: userId is automatically extracted from token
     * Returns 0 if no entry exists for that date
     * 
     * Example:
     *   GET /api/journal-entries/focus-time?date=2025-12-03
     *   Header: Authorization: Bearer <token>
     */
    @GetMapping("/focus-time")
    public ResponseEntity<Integer> getFocusTime(HttpServletRequest request,
                                                @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        if (date == null) {
            return ResponseEntity.badRequest().build();
        }

        int minutes = journalEntryService.getTotalFocusMinutes(userId, date);
        return ResponseEntity.ok(minutes);
    }

    /**
     * Get evaluation/summary for a specific date (backward compatibility)
     * Note: Multiple journals per day are allowed, this endpoint returns the first created entry with evaluation field
     * 
     * Note: userId is automatically extracted from token
     * 
     * Example:
     *   GET /api/journal-entries/evaluation?date=2025-12-03
     *   Header: Authorization: Bearer <token>
     * Returns:
     *   - Found: First JournalEntry (evaluation field may be null)
     *   - Not found: 404
     */
    @GetMapping("/evaluation")
    public ResponseEntity<JournalEntry> getEvaluation(HttpServletRequest request,
                                                      @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        if (date == null) {
            return ResponseEntity.badRequest().build();
        }

        List<JournalEntry> entries = journalEntryService.findByUserAndDate(userId, date);
        if (entries.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        JournalEntry entry = entries.stream()
                .filter(e -> e.getEvaluation() != null && !e.getEvaluation().isEmpty())
                .findFirst()
                .orElse(entries.get(0));
        
        return ResponseEntity.ok(entry);
    }

    /**
     * Add focus minutes after Pomodoro timer ends
     * 
     * Note: userId is automatically extracted from token
     * 
     * Request body example:
     * {
     *   "date": "2025-12-03",
     *   "focusMinutes": 25
     * }
     * 
     * Logic:
     *   - If entry exists for that day, add to existing totalFocusMinutes
     *   - If no entry exists, create new JournalEntry with focusMinutes
     *   - Evaluation field is not modified here
     */
    @PostMapping("/focus-time")
    public ResponseEntity<JournalEntry> addFocusMinutes(HttpServletRequest httpRequest,
                                                         @RequestBody FocusIncrementRequest request) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        LocalDate date = request.getDate();
        Integer focusMinutes = request.getFocusMinutes();

        if (date == null || focusMinutes == null || focusMinutes <= 0) {
            return ResponseEntity.badRequest().build();
        }

        JournalEntry saved =
                journalEntryService.addFocusMinutes(userId, date, focusMinutes);
        return ResponseEntity.ok(saved);
    }

    /**
     * Update or insert evaluation for a specific date
     * 
     * Note: userId is automatically extracted from token
     * 
     * Example request:
     *   PUT /api/journal-entries/evaluation
     *   Header: Authorization: Bearer <token>
     *   {
     *     "date": "2025-12-03",
     *     "evaluation": "Good state today, completed all plans."
     *   }
     */
    @PutMapping("/evaluation")
    public ResponseEntity<JournalEntry> upsertEvaluation(HttpServletRequest httpRequest,
                                                           @RequestBody EvaluationRequest request) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        LocalDate date = request.getDate();
        String evaluation = request.getEvaluation();

        if (date == null) {
            return ResponseEntity.badRequest().build();
        }

        JournalEntry entry = journalEntryService.upsertEvaluation(userId, date, evaluation);
        return ResponseEntity.ok(entry);
    }

    /**
     * Request body for Pomodoro timer focus time increment
     * Note: userId is extracted from token, not needed in request body
     */
    public static class FocusIncrementRequest {
        private LocalDate date;
        private Integer focusMinutes;

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public Integer getFocusMinutes() {
            return focusMinutes;
        }

        public void setFocusMinutes(Integer focusMinutes) {
            this.focusMinutes = focusMinutes;
        }
    }

    /**
     * Request body for evaluation update
     * Note: userId is extracted from token, not needed in request body
     */
    public static class EvaluationRequest {
        private LocalDate date;
        private String evaluation;

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public String getEvaluation() {
            return evaluation;
        }

        public void setEvaluation(String evaluation) {
            this.evaluation = evaluation;
        }
    }
}


