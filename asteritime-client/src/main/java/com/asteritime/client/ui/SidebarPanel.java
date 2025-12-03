package com.asteritime.client.ui;

import javax.swing.*;
import java.awt.*;

/**
 * 左侧导航栏
 */
public class SidebarPanel extends JPanel {
    
    private MainFrame mainFrame;
    
    public SidebarPanel(MainFrame mainFrame) {
        this.mainFrame = mainFrame;
        setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));
        setPreferredSize(new Dimension(200, 0));
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        addButton("Dashboard", "DASHBOARD");
        addButton("Timeline", "TIMELINE");
        addButton("Pomodoro", "POMODORO");
        addButton("Analytics", "ANALYTICS");
        addButton("Journal", "JOURNAL");
        addButton("Settings", "SETTINGS");
        
        add(Box.createVerticalGlue());
    }
    
    private void addButton(String text, String action) {
        JButton button = new JButton(text);
        button.setAlignmentX(Component.LEFT_ALIGNMENT);
        button.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
        button.addActionListener(e -> {
            if (mainFrame != null && !action.equals("SETTINGS")) {
                mainFrame.switchView(action);
            } else {
                System.out.println("Switch to: " + action);
            }
        });
        add(button);
        add(Box.createVerticalStrut(5));
    }
}

