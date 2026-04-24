package com.buy237.controller.search;

import com.buy237.dto.search.SearchRequest;
import com.buy237.dto.search.SearchResponse;
import com.buy237.service.search.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    @Autowired
    private SearchService searchService;

    @PostMapping
    public ResponseEntity<List<SearchResponse>> searchProducts(@RequestBody SearchRequest request) {
        List<SearchResponse> results = searchService.searchProducts(request);
        return ResponseEntity.ok(results);
    }
}
