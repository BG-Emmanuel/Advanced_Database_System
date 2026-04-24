package com.buy237.service.search;

import com.buy237.dto.search.SearchRequest;
import com.buy237.dto.search.SearchResponse;
import com.buy237.model.Product;
import com.buy237.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {
    @Autowired
    private ProductRepository productRepository;

    public List<SearchResponse> searchProducts(SearchRequest request) {
        List<Product> products = productRepository.findAll();
        return products.stream()
                .filter(p -> request.getQuery() == null || p.getName().toLowerCase().contains(request.getQuery().toLowerCase()) || p.getDescription().toLowerCase().contains(request.getQuery().toLowerCase()))
                .filter(p -> request.getCategory() == null || p.getCategory().equalsIgnoreCase(request.getCategory()))
                .filter(p -> request.getMinPrice() == null || p.getPrice() >= request.getMinPrice())
                .filter(p -> request.getMaxPrice() == null || p.getPrice() <= request.getMaxPrice())
                .map(this::toSearchResponse)
                .collect(Collectors.toList());
    }

    private SearchResponse toSearchResponse(Product product) {
        SearchResponse resp = new SearchResponse();
        resp.setId(product.getId());
        resp.setName(product.getName());
        resp.setDescription(product.getDescription());
        resp.setPrice(product.getPrice());
        resp.setCategory(product.getCategory());
        resp.setSlug(product.getSlug());
        return resp;
    }
}
