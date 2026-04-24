package com.buy237.service.address;

import com.buy237.model.address.Address;
import com.buy237.repository.address.AddressRepository;
import com.buy237.dto.address.AddressRequest;
import com.buy237.dto.address.AddressResponse;
import com.buy237.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressService {
    @Autowired
    private AddressRepository addressRepository;

    public AddressResponse addAddress(Long userId, AddressRequest request) {
        Address address = Address.builder()
                .userId(userId)
                .street(request.getStreet())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .build();
        address = addressRepository.save(address);
        return toAddressResponse(address);
    }

    public List<AddressResponse> getAddressesByUser(Long userId) {
        return addressRepository.findByUserId(userId).stream().map(this::toAddressResponse).collect(Collectors.toList());
    }

    public void deleteAddress(Long addressId) {
        if (!addressRepository.existsById(addressId)) {
            throw new ResourceNotFoundException("Address not found");
        }
        addressRepository.deleteById(addressId);
    }

    private AddressResponse toAddressResponse(Address address) {
        AddressResponse resp = new AddressResponse();
        resp.setId(address.getId());
        resp.setUserId(address.getUserId());
        resp.setStreet(address.getStreet());
        resp.setCity(address.getCity());
        resp.setState(address.getState());
        resp.setCountry(address.getCountry());
        resp.setPostalCode(address.getPostalCode());
        return resp;
    }
}
