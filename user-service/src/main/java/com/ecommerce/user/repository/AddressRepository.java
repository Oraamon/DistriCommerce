package com.ecommerce.user.repository;

import com.ecommerce.user.model.Address;
import com.ecommerce.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    
    List<Address> findByUser(User user);
    
    Optional<Address> findByUserAndDefaultAddressTrue(User user);
} 