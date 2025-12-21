package org.moysha.managementservice.service;

import java.util.List;
import java.util.stream.Collectors;
import org.moysha.managementservice.api.dto.CategoryDto;
import org.moysha.managementservice.api.request.CategoryRequest;
import org.moysha.managementservice.domain.category.CategoryEntity;
import org.moysha.managementservice.exception.ConflictException;
import org.moysha.managementservice.exception.NotFoundException;
import org.moysha.managementservice.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> findAll() {
        return categoryRepository.findAll().stream()
            .map(entity -> new CategoryDto(entity.getId(), entity.getName()))
            .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto create(CategoryRequest request) {
        categoryRepository.findByNameIgnoreCase(request.getName())
            .ifPresent(existing -> {
                throw new ConflictException("Category already exists: " + existing.getName());
            });
        CategoryEntity entity = new CategoryEntity();
        entity.setName(request.getName());
        return toDto(categoryRepository.save(entity));
    }

    @Transactional
    public CategoryDto rename(Long id, CategoryRequest request) {
        CategoryEntity entity = categoryRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Category not found: " + id));
        if (!entity.getName().equalsIgnoreCase(request.getName())) {
            categoryRepository.findByNameIgnoreCase(request.getName())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new ConflictException("Category already exists: " + existing.getName());
                    }
                });
            entity.setName(request.getName());
        }
        return toDto(categoryRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("Category not found: " + id);
        }
        categoryRepository.deleteById(id);
    }

    private CategoryDto toDto(CategoryEntity entity) {
        return new CategoryDto(entity.getId(), entity.getName());
    }
}
