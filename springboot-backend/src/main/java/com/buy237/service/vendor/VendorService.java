package com.buy237.service.vendor;

import com.buy237.model.vendor.Vendor;
import com.buy237.repository.vendor.VendorRepository;
import com.buy237.dto.vendor.VendorRequest;
import com.buy237.dto.vendor.VendorResponse;
import com.buy237.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VendorService {
    @Autowired
    private VendorRepository vendorRepository;

    public VendorResponse registerVendor(VendorRequest request) {
        Vendor vendor = Vendor.builder()
                .email(request.getEmail())
                .name(request.getName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .approved(false)
                .build();
        vendor = vendorRepository.save(vendor);
        return toVendorResponse(vendor);
    }

    public List<VendorResponse> getAllVendors() {
        return vendorRepository.findAll().stream().map(this::toVendorResponse).collect(Collectors.toList());
    }

    public VendorResponse getVendorById(Long id) {
        Vendor vendor = vendorRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
        return toVendorResponse(vendor);
    }

    public void approveVendor(Long id) {
        Vendor vendor = vendorRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
        vendor.setApproved(true);
        vendorRepository.save(vendor);
    }

    public void deleteVendor(Long id) {
        if (!vendorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vendor not found");
        }
        vendorRepository.deleteById(id);
    }

    private VendorResponse toVendorResponse(Vendor vendor) {
        VendorResponse resp = new VendorResponse();
        resp.setId(vendor.getId());
        resp.setEmail(vendor.getEmail());
        resp.setName(vendor.getName());
        resp.setPhone(vendor.getPhone());
        resp.setAddress(vendor.getAddress());
        resp.setApproved(vendor.isApproved());
        return resp;
    }
}
