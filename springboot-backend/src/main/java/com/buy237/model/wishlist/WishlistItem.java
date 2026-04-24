package com.buy237.model.wishlist;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "wishlist_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long productId;
}
