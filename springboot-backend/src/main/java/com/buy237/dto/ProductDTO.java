package com.buy237.dto;

import lombok.Data;

@Data
public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private Double sale;
    private String category;
    private String slug;
}
