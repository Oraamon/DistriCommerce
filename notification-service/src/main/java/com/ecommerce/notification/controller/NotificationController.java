package com.ecommerce.notification.controller;

import com.ecommerce.notification.dto.NotificationRequest;
import com.ecommerce.notification.dto.NotificationResponse;
import com.ecommerce.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> createNotification(@Valid @RequestBody NotificationRequest request) {
        return new ResponseEntity<>(notificationService.createNotification(request), HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(@PathVariable String userId) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationResponse>> getUserUnreadNotifications(@PathVariable String userId) {
        return ResponseEntity.ok(notificationService.getUserUnreadNotifications(userId));
    }

    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Map<String, Long>> countUserUnreadNotifications(@PathVariable String userId) {
        Map<String, Long> response = new HashMap<>();
        response.put("count", notificationService.countUserUnreadNotifications(userId));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markNotificationAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markNotificationAsRead(id));
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllNotificationsAsRead(@PathVariable String userId) {
        notificationService.markAllNotificationsAsRead(userId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/cart")
    public ResponseEntity<Void> sendCartNotification(@RequestBody Map<String, Object> requestBody) {
        String userId = (String) requestBody.get("userId");
        String action = (String) requestBody.get("action");
        String data = requestBody.get("data").toString();
        
        notificationService.sendCartNotification(userId, action, data);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/order")
    public ResponseEntity<Void> sendOrderNotification(@RequestBody Map<String, Object> requestBody) {
        String userId = (String) requestBody.get("userId");
        String action = (String) requestBody.get("action");
        String data = requestBody.get("data").toString();
        
        notificationService.sendOrderNotification(userId, action, data);
        return ResponseEntity.ok().build();
    }
} 