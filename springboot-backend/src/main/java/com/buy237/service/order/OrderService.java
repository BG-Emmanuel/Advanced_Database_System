package com.buy237.service.order;

import com.buy237.model.order.Order;
import com.buy237.model.order.OrderItem;
import com.buy237.repository.order.OrderRepository;
import com.buy237.repository.order.OrderItemRepository;
import com.buy237.dto.order.OrderRequest;
import com.buy237.dto.order.OrderResponse;
import com.buy237.dto.order.OrderItemRequest;
import com.buy237.dto.order.OrderItemResponse;
import com.buy237.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private OrderItemRepository orderItemRepository;

    public OrderResponse createOrder(Long userId, OrderRequest request) {
        Order order = Order.builder()
                .userId(userId)
                .totalAmount(request.getTotalAmount())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        order = orderRepository.save(order);
        List<OrderItem> items = request.getItems().stream().map(itemReq -> {
            OrderItem item = OrderItem.builder()
                    .order(order)
                    .productId(itemReq.getProductId())
                    .quantity(itemReq.getQuantity())
                    .price(itemReq.getPrice())
                    .build();
            return orderItemRepository.save(item);
        }).collect(Collectors.toList());
        order.setItems(items);
        return toOrderResponse(order);
    }

    public List<OrderResponse> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId).stream().map(this::toOrderResponse).collect(Collectors.toList());
    }

    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return toOrderResponse(order);
    }

    private OrderResponse toOrderResponse(Order order) {
        OrderResponse resp = new OrderResponse();
        resp.setId(order.getId());
        resp.setUserId(order.getUserId());
        resp.setTotalAmount(order.getTotalAmount());
        resp.setStatus(order.getStatus());
        resp.setCreatedAt(order.getCreatedAt());
        List<OrderItemResponse> itemResponses = order.getItems() != null ? order.getItems().stream().map(item -> {
            OrderItemResponse ir = new OrderItemResponse();
            ir.setProductId(item.getProductId());
            ir.setQuantity(item.getQuantity());
            ir.setPrice(item.getPrice());
            return ir;
        }).collect(Collectors.toList()) : List.of();
        resp.setItems(itemResponses);
        return resp;
    }
}
