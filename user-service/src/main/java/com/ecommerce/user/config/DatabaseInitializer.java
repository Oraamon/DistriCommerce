package com.ecommerce.user.config;

import com.ecommerce.user.model.ERole;
import com.ecommerce.user.model.Role;
import com.ecommerce.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        initRoles();
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
} 