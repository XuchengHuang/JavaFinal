package com.asteritime.client.ui;

import javax.swing.*;
import java.awt.*;

/**
 * Timeline 面板 - 24小时时间线视图
 */
public class TimelinePanel extends JPanel {
    
    public TimelinePanel() {
        setLayout(new BorderLayout());
        setBackground(Color.WHITE);
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        // 顶部：日期选择器
        JPanel headerPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        headerPanel.add(new JLabel("Date:"));
        headerPanel.add(new JComboBox<>()); // TODO: 日期选择器
        add(headerPanel, BorderLayout.NORTH);
        
        // 中间：时间线网格
        TimelineGridPanel timelineGrid = new TimelineGridPanel();
        add(new JScrollPane(timelineGrid), BorderLayout.CENTER);
    }
}

/**
 * 时间线网格面板
 */
class TimelineGridPanel extends JPanel {
    public TimelineGridPanel() {
        setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));
        setBackground(Color.WHITE);
        
        // 生成 24 小时时间线
        for (int hour = 0; hour < 24; hour++) {
            JPanel hourRow = new JPanel(new BorderLayout());
            hourRow.setPreferredSize(new Dimension(0, 60));
            hourRow.setBorder(BorderFactory.createMatteBorder(0, 0, 1, 0, Color.LIGHT_GRAY));
            
            JLabel timeLabel = new JLabel(String.format("%02d:00", hour));
            timeLabel.setPreferredSize(new Dimension(60, 0));
            hourRow.add(timeLabel, BorderLayout.WEST);
            
            // TODO: 添加任务块、番茄钟会话块
            JPanel contentPanel = new JPanel();
            contentPanel.setBackground(Color.WHITE);
            hourRow.add(contentPanel, BorderLayout.CENTER);
            
            add(hourRow);
        }
    }
}


