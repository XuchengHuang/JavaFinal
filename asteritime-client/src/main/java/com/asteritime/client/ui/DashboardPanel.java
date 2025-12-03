package com.asteritime.client.ui;

import javax.swing.*;
import java.awt.*;

/**
 * Dashboard 面板 - Eisenhower 四象限 + Kanban
 */
public class DashboardPanel extends JPanel {
    
    public DashboardPanel() {
        setLayout(new BorderLayout());
        setBackground(Color.WHITE);
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        // 顶部：Eisenhower 四象限
        JPanel quadrantPanel = createQuadrantPanel();
        add(quadrantPanel, BorderLayout.CENTER);
        
        // 底部：Kanban 看板
        JPanel kanbanPanel = createKanbanPanel();
        kanbanPanel.setPreferredSize(new Dimension(0, 200));
        add(kanbanPanel, BorderLayout.SOUTH);
    }
    
    private JPanel createQuadrantPanel() {
        JPanel panel = new JPanel(new GridLayout(2, 2, 10, 10));
        panel.setBorder(BorderFactory.createTitledBorder("Eisenhower Quadrants"));
        
        panel.add(new QuadrantPanel(1, "Urgent & Important"));
        panel.add(new QuadrantPanel(2, "Not Urgent & Important"));
        panel.add(new QuadrantPanel(3, "Urgent & Not Important"));
        panel.add(new QuadrantPanel(4, "Not Urgent & Not Important"));
        
        return panel;
    }
    
    private JPanel createKanbanPanel() {
        JPanel panel = new JPanel(new GridLayout(1, 4, 10, 0));
        panel.setBorder(BorderFactory.createTitledBorder("Kanban Board"));
        
        panel.add(new KanbanColumn("Backlog"));
        panel.add(new KanbanColumn("ToDo"));
        panel.add(new KanbanColumn("Doing"));
        panel.add(new KanbanColumn("Done"));
        
        return panel;
    }
}

/**
 * 单个象限面板
 */
class QuadrantPanel extends JPanel {
    public QuadrantPanel(int quadrant, String title) {
        setLayout(new BorderLayout());
        setBorder(BorderFactory.createTitledBorder(title));
        setBackground(Color.WHITE);
        
        // TODO: 添加任务卡片列表，支持拖拽
        JLabel placeholder = new JLabel("Tasks will appear here", JLabel.CENTER);
        add(placeholder, BorderLayout.CENTER);
    }
}

/**
 * Kanban 列
 */
class KanbanColumn extends JPanel {
    public KanbanColumn(String title) {
        setLayout(new BorderLayout());
        setBorder(BorderFactory.createTitledBorder(title));
        setBackground(Color.WHITE);
        
        // TODO: 添加任务卡片列表，支持拖拽
        JLabel placeholder = new JLabel("Tasks", JLabel.CENTER);
        add(placeholder, BorderLayout.CENTER);
    }
}


