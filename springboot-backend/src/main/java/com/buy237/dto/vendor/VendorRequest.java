package com.buy237.dto.vendor;

import lombok.Data;

@Data
public class VendorRequest {
    private String email;
    private String name;
    private String phone;
    private String address;
}
