package com.ecommerce.user.service.impl;

import com.ecommerce.user.dto.request.AddressRequest;
import com.ecommerce.user.dto.response.AddressResponse;
import com.ecommerce.user.dto.response.UserResponse;
import com.ecommerce.user.model.Address;
import com.ecommerce.user.model.User;
import com.ecommerce.user.repository.AddressRepository;
import com.ecommerce.user.repository.UserRepository;
import com.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com id: " + id));

        return mapToUserResponse(user);
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com email: " + email));

        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserResponse userResponse) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com id: " + id));

        user.setFirstName(userResponse.getFirstName());
        user.setLastName(userResponse.getLastName());
        user.setPhoneNumber(userResponse.getPhoneNumber());

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public AddressResponse addAddress(Long userId, AddressRequest addressRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com id: " + userId));

        // Se a solicitação for para definir este endereço como padrão e já houver um endereço padrão
        if (addressRequest.isDefaultAddress()) {
            addressRepository.findByUserAndDefaultAddressTrue(user)
                    .ifPresent(address -> {
                        address.setDefaultAddress(false);
                        addressRepository.save(address);
                    });
        }

        Address address = Address.builder()
                .user(user)
                .street(addressRequest.getStreet())
                .number(addressRequest.getNumber())
                .complement(addressRequest.getComplement())
                .neighborhood(addressRequest.getNeighborhood())
                .city(addressRequest.getCity())
                .state(addressRequest.getState())
                .country(addressRequest.getCountry())
                .zipCode(addressRequest.getZipCode())
                .defaultAddress(addressRequest.isDefaultAddress())
                .build();

        Address savedAddress = addressRepository.save(address);
        return mapToAddressResponse(savedAddress);
    }

    @Override
    public List<AddressResponse> getAddressesByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com id: " + userId));

        List<Address> addresses = addressRepository.findByUser(user);
        return addresses.stream()
                .map(this::mapToAddressResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AddressResponse getAddressById(Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Endereço não encontrado com id: " + addressId));

        return mapToAddressResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long addressId, AddressRequest addressRequest) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Endereço não encontrado com id: " + addressId));

        // Se a solicitação for para definir este endereço como padrão e já houver um endereço padrão
        if (addressRequest.isDefaultAddress() && !address.isDefaultAddress()) {
            addressRepository.findByUserAndDefaultAddressTrue(address.getUser())
                    .ifPresent(defaultAddress -> {
                        defaultAddress.setDefaultAddress(false);
                        addressRepository.save(defaultAddress);
                    });
        }

        address.setStreet(addressRequest.getStreet());
        address.setNumber(addressRequest.getNumber());
        address.setComplement(addressRequest.getComplement());
        address.setNeighborhood(addressRequest.getNeighborhood());
        address.setCity(addressRequest.getCity());
        address.setState(addressRequest.getState());
        address.setCountry(addressRequest.getCountry());
        address.setZipCode(addressRequest.getZipCode());
        address.setDefaultAddress(addressRequest.isDefaultAddress());

        Address updatedAddress = addressRepository.save(address);
        return mapToAddressResponse(updatedAddress);
    }

    @Override
    @Transactional
    public void deleteAddress(Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Endereço não encontrado com id: " + addressId));

        addressRepository.delete(address);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com id: " + id));

        userRepository.delete(user);
    }

    private UserResponse mapToUserResponse(User user) {
        List<Address> addresses = addressRepository.findByUser(user);
        List<AddressResponse> addressResponses = addresses.stream()
                .map(this::mapToAddressResponse)
                .collect(Collectors.toList());

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toList()))
                .addresses(addressResponses)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private AddressResponse mapToAddressResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .street(address.getStreet())
                .number(address.getNumber())
                .complement(address.getComplement())
                .neighborhood(address.getNeighborhood())
                .city(address.getCity())
                .state(address.getState())
                .country(address.getCountry())
                .zipCode(address.getZipCode())
                .defaultAddress(address.isDefaultAddress())
                .build();
    }
} 