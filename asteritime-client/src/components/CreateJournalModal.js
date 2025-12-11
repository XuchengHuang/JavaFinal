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

  // 当编辑时，填充表单数据
  useEffect(() => {
    if (entry) {
      // 解析图片URLs
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
      // 新建时重置表单
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
    const url = prompt('请输入图片URL:');
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
      // 准备数据
      const journalData = {
        date: formData.date,
      };

      if (entry) {
        // 更新：发送所有字段，包括空字符串（用于清空字段）
        journalData.title = formData.title || null;
        journalData.contentText = formData.contentText || null;
        journalData.imageUrls = formData.imageUrls || null;
        journalData.weather = formData.weather || null;
        journalData.mood = formData.mood || null;
        journalData.activity = formData.activity || null;
        journalData.voiceNoteUrl = formData.voiceNoteUrl || null;
        
        await updateJournalEntry(entry.id, journalData);
      } else {
        // 创建：只添加非空字段
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
      console.error('保存日记失败:', err);
      setError(err.message || '保存日记失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content journal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{entry ? '编辑日记' : '新建日记'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">日期 *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="title">标题</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="给这篇日记起个标题..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="contentText">内容</label>
            <textarea
              id="contentText"
              name="contentText"
              value={formData.contentText}
              onChange={handleChange}
              placeholder="记录今天发生的事情..."
              rows={8}
            />
          </div>

          {/* 分类标签 */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weather">天气</label>
              <input
                type="text"
                id="weather"
                name="weather"
                value={formData.weather}
                onChange={handleChange}
                placeholder="例如：晴天、雨天"
              />
            </div>

            <div className="form-group">
              <label htmlFor="mood">心情</label>
              <input
                type="text"
                id="mood"
                name="mood"
                value={formData.mood}
                onChange={handleChange}
                placeholder="例如：开心、平静"
              />
            </div>

            <div className="form-group">
              <label htmlFor="activity">活动</label>
              <input
                type="text"
                id="activity"
                name="activity"
                value={formData.activity}
                onChange={handleChange}
                placeholder="例如：工作、学习"
              />
            </div>
          </div>

          {/* 图片 */}
          <div className="form-group">
            <label>图片</label>
            <div className="image-urls-section">
              {imageUrlsArray.map((url, index) => (
                <div key={index} className="image-url-item">
                  <img src={url} alt={`预览 ${index + 1}`} className="image-preview" />
                  <span className="image-url-text" title={url}>
                    {url.length > 40 ? url.substring(0, 40) + '...' : url}
                  </span>
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => handleImageUrlRemove(index)}
                  >
                    删除
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-add-image"
                onClick={handleImageUrlAdd}
              >
                + 添加图片URL
              </button>
            </div>
          </div>

          {/* 语音 */}
          <div className="form-group">
            <label htmlFor="voiceNoteUrl">语音记录URL</label>
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
                  您的浏览器不支持音频播放
                </audio>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '保存中...' : entry ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateJournalModal;
