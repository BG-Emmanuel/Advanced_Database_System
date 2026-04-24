package com.buy237.repository.vendor;

import com.buy237.model.vendor.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    Optional<Vendor> findByEmail(String email);
}
