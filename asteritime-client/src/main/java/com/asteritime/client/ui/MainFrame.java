package com.asteritime.client.ui;

import javax.swing.*;
import java.awt.*;

/**
 * 主窗口框架
 */
public class MainFrame extends JFrame {
    
    private static final int WINDOW_WIDTH = 1200;
    private static final int WINDOW_HEIGHT = 800;
    
    public MainFrame() {
        initializeFrame();
        createComponents();
    }
    
    private void initializeFrame() {
        setTitle("AsteriTime - Daily Timeline Manager");
        setSize(WINDOW_WIDTH, WINDOW_HEIGHT);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());
    }
    
    private CardLayout cardLayout;
    private JPanel mainContent;
    
    private void createComponents() {
        // 左侧导航栏
        SidebarPanel sidebar = new SidebarPanel(this);
        add(sidebar, BorderLayout.WEST);
        
        // 主内容区域（卡片布局，切换不同视图）
        cardLayout = new CardLayout();
        mainContent = new JPanel(cardLayout);
        mainContent.add(new DashboardPanel(), "DASHBOARD");
        mainContent.add(new TimelinePanel(), "TIMELINE");
        mainContent.add(new PomodoroPanel(), "POMODORO");
        mainContent.add(new AnalyticsPanel(), "ANALYTICS");
        mainContent.add(new JournalPanel(), "JOURNAL");
        
        add(mainContent, BorderLayout.CENTER);
        
        // 默认显示 Dashboard
        cardLayout.show(mainContent, "DASHBOARD");
    }
    
    /**
     * 切换视图
     */
    public void switchView(String viewName) {
        System.out.println("Switching to view: " + viewName);
        cardLayout.show(mainContent, viewName);
        // 强制刷新界面
        revalidate();
        repaint();
    }
}


