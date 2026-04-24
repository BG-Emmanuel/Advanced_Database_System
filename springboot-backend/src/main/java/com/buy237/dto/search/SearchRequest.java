package com.buy237.dto.search;

import lombok.Data;

@Data
public class SearchRequest {
    private String query;
    private String category;
    private Double minPrice;
    private Double maxPrice;
}
