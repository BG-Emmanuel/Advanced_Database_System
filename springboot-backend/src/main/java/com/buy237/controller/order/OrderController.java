package com.buy237.controller.order;

import com.buy237.dto.order.OrderRequest;
import com.buy237.dto.order.OrderResponse;
import com.buy237.service.order.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @Autowired
    private OrderService orderService;

    // For demo, userId is passed as a query param. In production, extract from JWT.
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestParam Long userId, @RequestBody OrderRequest request) {
        OrderResponse response = orderService.createOrder(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getOrdersByUser(@RequestParam Long userId) {
        List<OrderResponse> orders = orderService.getOrdersByUser(userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long orderId) {
        OrderResponse order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }
}
