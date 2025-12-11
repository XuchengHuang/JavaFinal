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
  // 新增：视图状态 - 'list' 显示列表, 'detail' 显示详情
  const [viewMode, setViewMode] = useState('list');
  // 新增：当前查看的journal详情
  const [viewingEntry, setViewingEntry] = useState(null);

  // 加载数据
  useEffect(() => {
    loadEntries();
  }, []);

  // 当选择的日期改变时，加载该天的日记，并切换到列表视图
  useEffect(() => {
    if (selectedDate) {
      loadEntriesByDate(selectedDate);
      setViewMode('list'); // 切换日期时回到列表视图
      setViewingEntry(null); // 清空详情
    }
  }, [selectedDate]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllJournalEntries();
      // 过滤掉自动创建的统计记录
      const filteredData = (Array.isArray(data) ? data : []).filter(
        entry => !isAutoCreatedStatsEntry(entry)
      );
      setAllEntries(filteredData);
      // 如果有选中的日期，加载该天的日记
      if (selectedDate) {
        const dayEntries = filteredData.filter(
          (entry) => entry.date === selectedDate
        );
        setEntries(dayEntries);
      }
    } catch (err) {
      console.error('加载日记失败:', err);
      const errorMsg = err.message || '加载日记失败，请刷新页面重试';
      setError(errorMsg);
      
      // 如果是401错误，提示重新登录
      if (errorMsg.includes('未授权') || errorMsg.includes('401')) {
        setTimeout(() => {
          if (window.confirm('登录已过期，是否重新登录？')) {
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
      // 过滤掉自动创建的统计记录（只有专注时间，没有其他内容）
      const filteredData = (Array.isArray(data) ? data : []).filter(
        entry => !isAutoCreatedStatsEntry(entry)
      );
      setEntries(filteredData);
    } catch (err) {
      console.error('加载日记失败:', err);
      const errorMsg = err.message || '加载日记失败，请刷新页面重试';
      setError(errorMsg);
      
      // 如果是401错误，提示重新登录
      if (errorMsg.includes('未授权') || errorMsg.includes('401')) {
        setTimeout(() => {
          if (window.confirm('登录已过期，是否重新登录？')) {
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

  // 点击journal条目，显示详情
  const handleEntryClick = (entry) => {
    setViewingEntry(entry);
    setViewMode('detail');
  };

  // 返回列表视图
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
      // 如果正在查看详情且删除的是当前查看的条目，返回列表
      if (viewMode === 'detail' && viewingEntry && viewingEntry.id === selectedEntry.id) {
        setViewMode('list');
        setViewingEntry(null);
      }
      // 重新加载数据
      if (selectedDate) {
        await loadEntriesByDate(selectedDate);
      }
      await loadEntries();
    } catch (err) {
      console.error('删除日记失败:', err);
      setError('删除日记失败，请重试');
    }
  };

  const handleModalSuccess = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedEntry(null);
    // 重新加载数据
    if (selectedDate) {
      loadEntriesByDate(selectedDate);
    }
    loadEntries();
    // 如果正在查看详情，刷新详情数据
    if (viewMode === 'detail' && viewingEntry) {
      // 重新加载该条目
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

  // 解析图片URLs（JSON格式）
  const parseImageUrls = (imageUrls) => {
    if (!imageUrls) return [];
    try {
      return JSON.parse(imageUrls);
    } catch {
      return [];
    }
  };

  // 检查某天是否有日记（排除自动创建的统计记录）
  const hasEntriesOnDate = (date) => {
    return allEntries.some((entry) => 
      entry.date === date && !isAutoCreatedStatsEntry(entry)
    );
  };

  // 检查是否是自动创建的统计记录（只有totalFocusMinutes，没有其他内容）
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

  // 获取有日记的日期列表（排除自动创建的统计记录）
  const getDatesWithEntries = () => {
    const dates = new Set();
    allEntries.forEach((entry) => {
      // 只包含有实际内容的日记，排除自动创建的统计记录
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
          <div className="loading">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="journal-container">
        <div className="journal-header">
          <div>
            <h1>日记</h1>
            <div className="timezone-info" title="当前时区">
              时区: {getCurrentTimezone()}
            </div>
          </div>
          <button className="btn-create" onClick={handleCreateClick}>
            + 新建日记
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* 日期选择器 */}
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
            />
            <span className="date-text">{formatLocalDateDisplay(selectedDate)}</span>
            <button className="btn-today" onClick={handleToday}>
              今天
            </button>
          </div>
          <button className="btn-nav" onClick={handleNextDay}>
            →
          </button>
        </div>

        {/* 根据视图模式显示不同内容 */}
        {viewMode === 'list' ? (
          /* 列表视图：显示该天的所有journal */
          <div className="journal-list-view">
            <div className="list-header">
              <h2>{formatLocalDateDisplay(selectedDate)} 的日记</h2>
              <span className="entry-count">共 {entries.length} 篇</span>
            </div>
            
            {entries.length === 0 ? (
              <div className="empty-state">
                <p>这一天还没有日记</p>
                <button className="btn-create-small" onClick={handleCreateClick}>
                  创建第一篇日记
                </button>
              </div>
            ) : (
              <div className="journal-list">
                {entries.map((entry) => {
                  // 调试：打印entry数据
                  console.log('Journal Entry:', entry);
                  
                  const preview = entry.contentText 
                    ? (entry.contentText.length > 100 
                        ? entry.contentText.substring(0, 100) + '...' 
                        : entry.contentText)
                    : (entry.evaluation 
                        ? (entry.evaluation.length > 100 
                            ? entry.evaluation.substring(0, 100) + '...' 
                            : entry.evaluation)
                        : '暂无内容');
                  
                  return (
                    <div 
                      key={entry.id} 
                      className="journal-list-item"
                      onClick={() => handleEntryClick(entry)}
                    >
                      <div className="list-item-header">
                        <div className="list-item-title">
                          {entry.title || '无标题'}
                        </div>
                        <div className="list-item-time">
                          {formatLocalTime(entry.createdAt)}
                        </div>
                      </div>
                      
                      {/* 标签预览 */}
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
                      
                      {/* 内容预览 */}
                      <div className="list-item-preview">
                        {preview}
                      </div>
                      
                      {/* 图标提示 */}
                      <div className="list-item-icons">
                        {entry.imageUrls && parseImageUrls(entry.imageUrls).length > 0 && (
                          <span className="icon-hint" title="包含图片">📷</span>
                        )}
                        {entry.voiceNoteUrl && (
                          <span className="icon-hint" title="包含语音">🎤</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* 详情视图：显示单个journal的完整内容 */
          viewingEntry && (
            <div className="journal-detail-view">
              <div className="detail-header">
                <button className="btn-back" onClick={handleBackToList}>
                  ← 返回列表
                </button>
                <div className="detail-title-section">
                  <h2>{viewingEntry.title || '无标题'}</h2>
                  <div className="detail-meta">
                    <span className="detail-date">{formatLocalDateDisplay(viewingEntry.date)}</span>
                    <span className="detail-time">{formatLocalTime(viewingEntry.createdAt)}</span>
                  </div>
                </div>
                <div className="detail-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEditClick(viewingEntry)}
                    title="编辑"
                  >
                    编辑
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteClick(viewingEntry)}
                    title="删除"
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* 分类标签 */}
              {(viewingEntry.weather || viewingEntry.mood || viewingEntry.activity) && (
                <div className="entry-tags">
                  {viewingEntry.weather && (
                    <span className="tag tag-weather">天气: {viewingEntry.weather}</span>
                  )}
                  {viewingEntry.mood && (
                    <span className="tag tag-mood">心情: {viewingEntry.mood}</span>
                  )}
                  {viewingEntry.activity && (
                    <span className="tag tag-activity">活动: {viewingEntry.activity}</span>
                  )}
                </div>
              )}

              {/* 文本内容 */}
              {viewingEntry.contentText && (
                <div className="entry-content">
                  <p>{viewingEntry.contentText}</p>
                </div>
              )}

              {/* 图片 */}
              {viewingEntry.imageUrls && parseImageUrls(viewingEntry.imageUrls).length > 0 && (
                <div className="entry-images">
                  {parseImageUrls(viewingEntry.imageUrls).map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`日记图片 ${index + 1}`}
                      className="entry-image"
                    />
                  ))}
                </div>
              )}

              {/* 语音 */}
              {viewingEntry.voiceNoteUrl && (
                <div className="entry-voice">
                  <audio controls src={viewingEntry.voiceNoteUrl}>
                    您的浏览器不支持音频播放
                  </audio>
                </div>
              )}

              {/* 评价（向后兼容） */}
              {viewingEntry.evaluation && (
                <div className="entry-evaluation">
                  <p className="evaluation-label">评价：</p>
                  <p>{viewingEntry.evaluation}</p>
                </div>
              )}

              {/* 如果没有任何内容，显示提示 */}
              {!viewingEntry.contentText && !viewingEntry.evaluation && 
               !viewingEntry.imageUrls && !viewingEntry.voiceNoteUrl && (
                <div className="entry-empty-content">
                  <p className="empty-content-hint">这篇日记还没有内容，点击"编辑"添加内容</p>
                </div>
              )}
            </div>
          )
        )}

        {/* 有日记的日期列表（侧边栏或底部） */}
        {allEntries.length > 0 && (
          <div className="dates-with-entries">
            <h3>有日记的日期</h3>
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

      {/* 创建/编辑模态框 */}
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

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedEntry(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="确认删除"
        message={`确定要删除这篇日记"${selectedEntry?.title || '无标题'}"吗？此操作无法撤销。`}
      />
    </div>
  );
}

export default Journal;
