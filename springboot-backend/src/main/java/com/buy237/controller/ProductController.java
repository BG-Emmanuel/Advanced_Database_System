package com.buy237.controller;

import com.buy237.model.Product;
import com.buy237.service.ProductService;
import com.buy237.dto.ProductDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    @Autowired
    private ProductService productService;

    @GetMapping
    public List<Product> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Product> getProductBySlug(@PathVariable String slug) {
        Product product = productService.getProductBySlug(slug);
        return ResponseEntity.ok(product);
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody ProductDTO productDTO) {
        Product created = productService.createProduct(productDTO);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
