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
 * Journal 相关接口
 *
 * 功能：
 *   - 创建、查询、更新、删除日记条目
 *   - 按日期查看日记（支持一天多个日记）
 *   - 获取当前用户的所有日志
 *   - 番茄钟倒计时结束后，累计当天的专注总时长
 */
@RestController
@RequestMapping("/journal-entries")
public class JournalEntryController {

    @Autowired
    private JournalEntryService journalEntryService;

    /**
     * 创建新的日记条目
     *
     * 示例：
     *   POST /api/journal-entries
     *   Header: Authorization: Bearer <token>
     *   Body: {
     *     "date": "2025-12-09",
     *     "title": "今天的心情",
     *     "contentText": "今天过得很充实...",
     *     "imageUrls": "[\"url1\", \"url2\"]",
     *     "weather": "晴天",
     *     "mood": "开心",
     *     "activity": "工作",
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
     * 根据ID获取日记条目
     *
     * 示例：
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
                    // 验证是否是自己的日记
                    if (!entry.getUser().getId().equals(userId)) {
                        return ResponseEntity.status(403).<JournalEntry>build();
                    }
                    return ResponseEntity.ok(entry);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 获取当前用户的所有日志（按日期倒序排列，最新的在前）
     *
     * 注意：userId 从 token 中自动获取，无需在请求参数中传递
     *
     * 示例：
     *   GET /api/journal-entries
     *   Header: Authorization: Bearer <token>
     *
     * 返回：当前用户的所有日志列表，按日期倒序排列
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
     * 按日期查询日记条目（返回该天的所有日记，按创建时间倒序）
     *
     * 示例：
     *   GET /api/journal-entries/by-date?date=2025-12-09
     *   Header: Authorization: Bearer <token>
     *
     * 返回：该天的所有日记列表，如果没有则返回空数组
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
     * 按日期范围查询日记条目
     *
     * 示例：
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
     * 更新日记条目
     *
     * 示例：
     *   PUT /api/journal-entries/{id}
     *   Header: Authorization: Bearer <token>
     *   Body: {
     *     "title": "更新的标题",
     *     "contentText": "更新的内容...",
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
            System.out.println("更新日记请求 - userId: " + userId + ", entryId: " + id);
            System.out.println("更新数据: " + updatedEntry);
            
            Optional<JournalEntry> result = journalEntryService.updateJournalEntry(userId, id, updatedEntry);
            
            if (result.isPresent()) {
                System.out.println("更新成功: " + result.get());
                return ResponseEntity.ok(result.get());
            } else {
                System.out.println("未找到日记条目: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (org.springframework.dao.OptimisticLockingFailureException e) {
            // 处理乐观锁冲突（并发更新冲突）
            System.err.println("并发更新冲突: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .header("X-Error-Message", "日记已被其他操作修改，请刷新后重试")
                    .build();
        } catch (IllegalArgumentException e) {
            System.err.println("权限错误: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(403).build();
        } catch (IllegalStateException e) {
            System.err.println("状态错误: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        } catch (Exception e) {
            // 记录异常日志，返回详细错误信息
            System.err.println("更新日记失败: " + e.getMessage());
            System.err.println("异常类型: " + e.getClass().getName());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * 删除日记条目
     *
     * 示例：
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
     * 初始化或获取当天的 JournalEntry。
     *
     * 前端在用户打开 APP（或登录成功）后调用一次即可。
     * 如果该用户当天还没有记录，则创建一条 totalFocusMinutes=0 的记录；
     * 如果已经存在，则直接返回已有记录。
     *
     * 注意：userId 从 token 中自动获取，无需在请求参数中传递
     *
     * 示例：
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
     * 查询某天的专注总时长（分钟）。
     *
     * 注意：userId 从 token 中自动获取
     *
     * 示例：
     *   GET /api/journal-entries/focus-time?date=2025-12-03
     *   Header: Authorization: Bearer <token>
     * 如果当天没有记录，则返回 0。
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
     * 查询某天的评价 / 总结（向后兼容接口）。
     * 注意：现在一天可以有多个journal，此接口返回该天第一个创建的条目（如果有evaluation字段）
     *
     * 注意：userId 从 token 中自动获取
     *
     * 示例：
     *   GET /api/journal-entries/evaluation?date=2025-12-03
     *   Header: Authorization: Bearer <token>
     * 返回：
     *   - 找到记录：返回第一个 JournalEntry（其中 evaluation 字段为该天的总结，可能为 null）
     *   - 未找到记录：返回 404
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
        
        // 返回第一个有evaluation的条目，或第一个条目
        JournalEntry entry = entries.stream()
                .filter(e -> e.getEvaluation() != null && !e.getEvaluation().isEmpty())
                .findFirst()
                .orElse(entries.get(0));
        
        return ResponseEntity.ok(entry);
    }

    /**
     * 番茄钟结束后累计专注时间。
     *
     * 注意：userId 从 token 中自动获取，无需在请求体中传递
     *
     * 请求体示例：
     * {
     *   "date": "2025-12-03",
     *   "focusMinutes": 25
     * }
     *
     * 逻辑：
     *   - 如果该用户在这一天已经有记录，则在原来的 totalFocusMinutes 基础上累加
     *   - 如果还没有记录，则创建一条新的 JournalEntry，总时长为本次 focusMinutes
     *   - evaluation 字段不在这里修改（保持原值或为 null）
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
     * 更新或新增某天的评价内容。
     *
     * 注意：userId 从 token 中自动获取，无需在请求体中传递
     *
     * 示例请求：
     *   PUT /api/journal-entries/evaluation
     *   Header: Authorization: Bearer <token>
     *   {
     *     "date": "2025-12-03",
     *     "evaluation": "今天状态不错，完成了所有计划。"
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
     * 用于接收番茄钟结束时的 JSON 请求体
     * 注意：userId 已从 token 中获取，不再需要在此传递
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
     * 用于接收评价更新的请求体
     * 注意：userId 已从 token 中获取，不再需要在此传递
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


