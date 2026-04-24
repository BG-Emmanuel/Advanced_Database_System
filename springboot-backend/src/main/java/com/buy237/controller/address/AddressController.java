package com.buy237.controller.address;

import com.buy237.dto.address.AddressRequest;
import com.buy237.dto.address.AddressResponse;
import com.buy237.service.address.AddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {
    @Autowired
    private AddressService addressService;

    // For demo, userId is passed as a query param. In production, extract from JWT.
    @PostMapping
    public ResponseEntity<AddressResponse> addAddress(@RequestParam Long userId, @RequestBody AddressRequest request) {
        AddressResponse response = addressService.addAddress(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AddressResponse>> getAddresses(@RequestParam Long userId) {
        List<AddressResponse> addresses = addressService.getAddressesByUser(userId);
        return ResponseEntity.ok(addresses);
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long addressId) {
        addressService.deleteAddress(addressId);
        return ResponseEntity.noContent().build();
    }
}
