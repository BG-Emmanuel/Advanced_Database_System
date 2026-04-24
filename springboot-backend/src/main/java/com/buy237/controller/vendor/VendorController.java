package com.buy237.controller.vendor;

import com.buy237.dto.vendor.VendorRequest;
import com.buy237.dto.vendor.VendorResponse;
import com.buy237.service.vendor.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {
    @Autowired
    private VendorService vendorService;

    @PostMapping
    public ResponseEntity<VendorResponse> registerVendor(@RequestBody VendorRequest request) {
        VendorResponse response = vendorService.registerVendor(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<VendorResponse>> getAllVendors() {
        List<VendorResponse> vendors = vendorService.getAllVendors();
        return ResponseEntity.ok(vendors);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendorResponse> getVendorById(@PathVariable Long id) {
        VendorResponse vendor = vendorService.getVendorById(id);
        return ResponseEntity.ok(vendor);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Void> approveVendor(@PathVariable Long id) {
        vendorService.approveVendor(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVendor(@PathVariable Long id) {
        vendorService.deleteVendor(id);
        return ResponseEntity.noContent().build();
    }
}
