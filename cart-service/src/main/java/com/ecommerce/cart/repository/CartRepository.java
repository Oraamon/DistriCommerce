package com.ecommerce.cart.repository;

import com.ecommerce.cart.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);
    
    @Query("SELECT c FROM Cart c WHERE c.userId = ?1")
    List<Cart> findAllByUserId(Long userId);
    
    @Query("SELECT c FROM Cart c WHERE c.userId = ?1 ORDER BY c.id ASC")
    Optional<Cart> findFirstByUserIdOrderById(Long userId);
} 