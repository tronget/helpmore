package org.moysha.managementservice.repository;

import java.util.Optional;
import org.moysha.managementservice.domain.category.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {

    Optional<CategoryEntity> findByNameIgnoreCase(String name);
}
