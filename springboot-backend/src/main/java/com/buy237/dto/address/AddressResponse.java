package com.buy237.dto.address;

import lombok.Data;

@Data
public class AddressResponse {
    private Long id;
    private Long userId;
    private String street;
    private String city;
    private String state;
    private String country;
    private String postalCode;
}
