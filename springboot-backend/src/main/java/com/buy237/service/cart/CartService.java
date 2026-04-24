package com.buy237.service.cart;

import com.buy237.model.cart.Cart;
import com.buy237.model.cart.CartItem;
import com.buy237.repository.cart.CartRepository;
import com.buy237.repository.cart.CartItemRepository;
import com.buy237.dto.cart.CartRequest;
import com.buy237.dto.cart.CartResponse;
import com.buy237.dto.cart.CartItemRequest;
import com.buy237.dto.cart.CartItemResponse;
import com.buy237.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CartService {
    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private CartItemRepository cartItemRepository;

    public CartResponse getCartByUser(Long userId) {
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = Cart.builder().userId(userId).build();
            return cartRepository.save(newCart);
        });
        return toCartResponse(cart);
    }

    public CartResponse updateCart(Long userId, CartRequest request) {
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = Cart.builder().userId(userId).build();
            return cartRepository.save(newCart);
        });
        cartItemRepository.deleteAll(cart.getItems());
        List<CartItem> items = request.getItems().stream().map(itemReq -> {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .productId(itemReq.getProductId())
                    .quantity(itemReq.getQuantity())
                    .build();
            return cartItemRepository.save(item);
        }).collect(Collectors.toList());
        cart.setItems(items);
        return toCartResponse(cart);
    }

    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId).orElseThrow(() -> new ResourceNotFoundException("Cart not found"));
        cartItemRepository.deleteAll(cart.getItems());
    }

    private CartResponse toCartResponse(Cart cart) {
        CartResponse resp = new CartResponse();
        resp.setId(cart.getId());
        resp.setUserId(cart.getUserId());
        List<CartItemResponse> itemResponses = cart.getItems() != null ? cart.getItems().stream().map(item -> {
            CartItemResponse ir = new CartItemResponse();
            ir.setProductId(item.getProductId());
            ir.setQuantity(item.getQuantity());
            return ir;
        }).collect(Collectors.toList()) : List.of();
        resp.setItems(itemResponses);
        return resp;
    }
}
