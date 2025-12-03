package com.asteritime.client;

import com.asteritime.client.ui.MainFrame;

import javax.swing.*;

/**
 * AsteriTime 客户端主入口
 */
public class AsteriTimeClient {
    
    public static void main(String[] args) {
        // 设置系统外观
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // 在 EDT 中启动 UI
        SwingUtilities.invokeLater(() -> {
            MainFrame mainFrame = new MainFrame();
            mainFrame.setVisible(true);
        });
    }
}


