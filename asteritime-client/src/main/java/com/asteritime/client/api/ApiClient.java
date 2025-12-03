package com.asteritime.client.api;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * REST API 客户端
 */
public class ApiClient {
    
    private static final String BASE_URL = "http://localhost:8080/api";
    private final OkHttpClient client;
    
    public ApiClient() {
        this.client = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
    }
    
    public String get(String endpoint) throws IOException {
        Request request = new Request.Builder()
                .url(BASE_URL + endpoint)
                .get()
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code: " + response);
            }
            return response.body().string();
        }
    }
    
    // TODO: 添加 POST, PUT, DELETE 方法
}


