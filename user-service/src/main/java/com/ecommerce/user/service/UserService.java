package com.ecommerce.user.service;

import com.ecommerce.user.dto.request.AddressRequest;
import com.ecommerce.user.dto.response.AddressResponse;
import com.ecommerce.user.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    
    UserResponse getUserById(Long id);
    
    UserResponse getUserByEmail(String email);
    
    UserResponse updateUser(Long id, UserResponse userResponse);
    
    AddressResponse addAddress(Long userId, AddressRequest addressRequest);
    
    List<AddressResponse> getAddressesByUserId(Long userId);
    
    AddressResponse getAddressById(Long addressId);
    
    AddressResponse updateAddress(Long addressId, AddressRequest addressRequest);
    
    void deleteAddress(Long addressId);
    
    void deleteUser(Long id);
} 