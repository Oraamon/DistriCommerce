package com.ecommerce.user.controller;

import com.ecommerce.user.dto.request.AddressRequest;
import com.ecommerce.user.dto.response.AddressResponse;
import com.ecommerce.user.dto.response.UserResponse;
import com.ecommerce.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UserResponse userResponse) {
        return ResponseEntity.ok(userService.updateUser(id, userResponse));
    }

    @PostMapping("/{userId}/addresses")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<AddressResponse> addAddress(@PathVariable Long userId, @Valid @RequestBody AddressRequest addressRequest) {
        return new ResponseEntity<>(userService.addAddress(userId, addressRequest), HttpStatus.CREATED);
    }

    @GetMapping("/{userId}/addresses")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<AddressResponse>> getAddressesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getAddressesByUserId(userId));
    }

    @GetMapping("/addresses/{addressId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<AddressResponse> getAddressById(@PathVariable Long addressId) {
        return ResponseEntity.ok(userService.getAddressById(addressId));
    }

    @PutMapping("/addresses/{addressId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<AddressResponse> updateAddress(@PathVariable Long addressId, @Valid @RequestBody AddressRequest addressRequest) {
        return ResponseEntity.ok(userService.updateAddress(addressId, addressRequest));
    }

    @DeleteMapping("/addresses/{addressId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long addressId) {
        userService.deleteAddress(addressId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
} 