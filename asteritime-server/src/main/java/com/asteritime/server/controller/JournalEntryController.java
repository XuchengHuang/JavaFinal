package com.asteritime.server.controller;

import com.asteritime.common.model.JournalEntry;
import com.asteritime.server.service.JournalEntryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;

/**
 * Journal 相关接口
 *
 * 功能：
 *   - 获取当前用户的所有日志
 *   - APP 当天首次打开时，初始化 / 获取当天的 JournalEntry
 *   - 番茄钟倒计时结束后，累计当天的专注总时长
 */
@RestController
@RequestMapping("/journal-entries")
public class JournalEntryController {

    @Autowired
    private JournalEntryService journalEntryService;

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
                                                @RequestParam("date") LocalDate date) {
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
     * 查询某天的评价 / 总结。
     *
     * 注意：userId 从 token 中自动获取
     *
     * 示例：
     *   GET /api/journal-entries/evaluation?date=2025-12-03
     *   Header: Authorization: Bearer <token>
     * 返回：
     *   - 找到记录：返回完整的 JournalEntry（其中 evaluation 字段为该天的总结，可能为 null）
     *   - 未找到记录：返回 404
     */
    @GetMapping("/evaluation")
    public ResponseEntity<JournalEntry> getEvaluation(HttpServletRequest request,
                                                      @RequestParam("date") LocalDate date) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        if (date == null) {
            return ResponseEntity.badRequest().build();
        }

        return journalEntryService.findByUserAndDate(userId, date)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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


