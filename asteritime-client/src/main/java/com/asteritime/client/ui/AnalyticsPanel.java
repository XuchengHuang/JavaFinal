package com.asteritime.client.ui;

import javax.swing.*;
import java.awt.*;

/**
 * Analytics 面板 - 统计分析图表
 */
public class AnalyticsPanel extends JPanel {
    
    public AnalyticsPanel() {
        setLayout(new BorderLayout());
        setBackground(Color.WHITE);
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        // 顶部：日期范围选择器
        JPanel headerPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        headerPanel.add(new JLabel("Date Range:"));
        headerPanel.add(new JComboBox<>()); // TODO: 日期范围选择
        add(headerPanel, BorderLayout.NORTH);
        
        // 中间：图表区域
        JPanel chartPanel = new JPanel(new GridLayout(1, 3, 10, 10));
        
        // Donut Chart - Quadrant Share
        JPanel donutPanel = new JPanel(new BorderLayout());
        donutPanel.setBorder(BorderFactory.createTitledBorder("Quadrant Share"));
        donutPanel.add(new JLabel("Donut Chart (TODO)", JLabel.CENTER), BorderLayout.CENTER);
        chartPanel.add(donutPanel);
        
        // Bar Chart - Category Share
        JPanel barPanel = new JPanel(new BorderLayout());
        barPanel.setBorder(BorderFactory.createTitledBorder("Category Share"));
        barPanel.add(new JLabel("Bar Chart (TODO)", JLabel.CENTER), BorderLayout.CENTER);
        chartPanel.add(barPanel);
        
        // Line Chart - Daily Focus
        JPanel linePanel = new JPanel(new BorderLayout());
        linePanel.setBorder(BorderFactory.createTitledBorder("Daily Focus"));
        linePanel.add(new JLabel("Line Chart (TODO)", JLabel.CENTER), BorderLayout.CENTER);
        chartPanel.add(linePanel);
        
        add(chartPanel, BorderLayout.CENTER);
    }
}


