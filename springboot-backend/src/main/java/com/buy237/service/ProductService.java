package com.buy237.service;

import com.buy237.model.Product;
import com.buy237.repository.ProductRepository;
import com.buy237.dto.ProductDTO;
import com.buy237.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductBySlug(String slug) {
        return productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    public Product createProduct(ProductDTO dto) {
        Product product = Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .sale(dto.getSale())
                .category(dto.getCategory())
                .slug(dto.getSlug())
                .build();
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found");
        }
        productRepository.deleteById(id);
    }
}
