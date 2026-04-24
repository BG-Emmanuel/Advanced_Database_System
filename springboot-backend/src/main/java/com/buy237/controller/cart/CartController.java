package com.buy237.controller.cart;

import com.buy237.dto.cart.CartRequest;
import com.buy237.dto.cart.CartResponse;
import com.buy237.service.cart.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    @Autowired
    private CartService cartService;

    // For demo, userId is passed as a query param. In production, extract from JWT.
    @GetMapping
    public ResponseEntity<CartResponse> getCart(@RequestParam Long userId) {
        CartResponse response = cartService.getCartByUser(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<CartResponse> updateCart(@RequestParam Long userId, @RequestBody CartRequest request) {
        CartResponse response = cartService.updateCart(userId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(@RequestParam Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
