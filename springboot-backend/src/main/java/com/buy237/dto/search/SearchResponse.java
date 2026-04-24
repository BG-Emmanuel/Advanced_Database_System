package com.buy237.dto.search;

import lombok.Data;

@Data
public class SearchResponse {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private String category;
    private String slug;
}
