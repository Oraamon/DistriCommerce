package com.ecommerce.user.config;

import com.ecommerce.user.model.ERole;
import com.ecommerce.user.model.Role;
import com.ecommerce.user.model.User;
import com.ecommerce.user.repository.RoleRepository;
import com.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initRoles();
        createAdminUser();
    }

    private void initRoles() {
        for (ERole eRole : ERole.values()) {
            try {
                if (roleRepository.findByName(eRole).isEmpty()) {
                    roleRepository.save(new Role(null, eRole));
                    log.info("Papel {} criado com sucesso", eRole.name());
                }
            } catch (Exception e) {
                log.error("Erro ao criar papel {}: {}", eRole.name(), e.getMessage());
            }
        }
    }
    
    private void createAdminUser() {
        try {
            // Verificar se já existe um usuário admin
            if (userRepository.findByEmail("admin@ecommerce.com").isEmpty()) {
                // Buscar os papéis
                Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                        .orElseThrow(() -> new RuntimeException("Papel ADMIN não encontrado"));
                Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                        .orElseThrow(() -> new RuntimeException("Papel USER não encontrado"));
                
                // Criar conjunto de papéis
                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                roles.add(userRole);
                
                // Criar usuário admin
                User adminUser = User.builder()
                        .email("admin@ecommerce.com")
                        .password(passwordEncoder.encode("admin123"))
                        .firstName("Administrador")
                        .lastName("Sistema")
                        .phoneNumber("123456789")
                        .enabled(true)
                        .roles(roles)
                        .build();
                
                userRepository.save(adminUser);
                log.info("Usuário administrador criado com sucesso");
            } else {
                log.info("Usuário administrador já existe");
            }
        } catch (Exception e) {
            log.error("Erro ao criar usuário administrador: {}", e.getMessage());
        }
    }
} 