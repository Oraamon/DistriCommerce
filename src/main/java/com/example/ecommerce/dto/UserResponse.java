package com.example.ecommerce.dto;

import com.example.ecommerce.model.Role;

import java.util.Set;

public class UserResponse {
    private String id;
    private String name;
    private String username;
    private String email;
    private Set<Role> roles;

    public UserResponse() {
    }

    public UserResponse(String id, String name, String username, String email, Set<Role> roles) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.email = email;
        this.roles = roles;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }
} 