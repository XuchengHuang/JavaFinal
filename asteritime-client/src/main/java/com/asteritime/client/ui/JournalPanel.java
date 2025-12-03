package com.asteritime.client.ui;

import javax.swing.*;
import java.awt.*;

/**
 * Journal 面板 - 日记功能
 */
public class JournalPanel extends JPanel {
    
    public JournalPanel() {
        setLayout(new BorderLayout());
        
        // 顶部：日期选择器和标签
        JPanel headerPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        headerPanel.add(new JLabel("Date:"));
        headerPanel.add(new JComboBox<>()); // TODO: 日期选择器
        headerPanel.add(new JLabel("Tags:"));
        headerPanel.add(new JTextField(20));
        headerPanel.add(new JButton("Insert Today Summary")); // TODO: 插入今日总结
        add(headerPanel, BorderLayout.NORTH);
        
        // 中间：文本编辑器
        JTextArea editor = new JTextArea();
        editor.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 14));
        editor.setLineWrap(true);
        editor.setWrapStyleWord(true);
        JScrollPane scrollPane = new JScrollPane(editor);
        add(scrollPane, BorderLayout.CENTER);
        
        // 底部：保存按钮
        JPanel footerPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        footerPanel.add(new JButton("Save"));
        add(footerPanel, BorderLayout.SOUTH);
    }
}


