package com.buy237.repository.wishlist;

import com.buy237.model.wishlist.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByUserId(Long userId);
    boolean existsByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserIdAndProductId(Long userId, Long productId);
}
