package com.asteritime.client.ui;

import javax.swing.*;
import java.awt.*;

/**
 * Pomodoro 面板 - 番茄钟计时器
 */
public class PomodoroPanel extends JPanel {
    
    private JLabel timerLabel;
    private JButton startButton;
    private JButton pauseButton;
    private JButton resetButton;
    
    public PomodoroPanel() {
        setLayout(new BorderLayout());
        setBackground(Color.WHITE);
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        // 顶部：任务选择
        JPanel headerPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        headerPanel.add(new JLabel("Select Task (optional):"));
        headerPanel.add(new JComboBox<>()); // TODO: 任务下拉框
        add(headerPanel, BorderLayout.NORTH);
        
        // 中间：计时器显示
        JPanel centerPanel = new JPanel(new GridBagLayout());
        centerPanel.setBackground(Color.WHITE);
        timerLabel = new JLabel("25:00", JLabel.CENTER);
        timerLabel.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 72));
        centerPanel.add(timerLabel);
        add(centerPanel, BorderLayout.CENTER);
        
        // 底部：控制按钮
        JPanel buttonPanel = new JPanel(new FlowLayout());
        startButton = new JButton("Start");
        pauseButton = new JButton("Pause");
        resetButton = new JButton("Reset");
        
        buttonPanel.add(startButton);
        buttonPanel.add(pauseButton);
        buttonPanel.add(resetButton);
        add(buttonPanel, BorderLayout.SOUTH);
        
        // TODO: 添加计时器逻辑
    }
}


