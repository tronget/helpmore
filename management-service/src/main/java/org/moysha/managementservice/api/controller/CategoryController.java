package org.moysha.managementservice.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.moysha.managementservice.api.dto.CategoryDto;
import org.moysha.managementservice.api.request.CategoryRequest;
import org.moysha.managementservice.service.CategoryService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryDto> list() {
        System.err.println("GET /api/categories");
        return categoryService.findAll();
    }

    @PostMapping
    public CategoryDto create(@Valid @RequestBody CategoryRequest request) {
        System.err.println("POST /api/categories");
        return categoryService.create(request);
    }

    @PutMapping("/{id}")
    public CategoryDto rename(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        System.err.println("PUT /api/categories/{id}");
        return categoryService.rename(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        System.err.println("DELETE /api/categories/{id}");
        categoryService.delete(id);
    }
}
