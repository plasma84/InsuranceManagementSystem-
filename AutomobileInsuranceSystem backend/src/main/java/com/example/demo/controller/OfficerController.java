package com.example.demo.controller;

import com.example.demo.entity.Officer;
import com.example.demo.service.OfficerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/officer")
@Tag(name = "Officer Management", description = "APIs for officer management (requires authentication)")
public class OfficerController {

    @Autowired
    private OfficerService officerService;

    @GetMapping("/{id}")
    @Operation(summary = "Get officer by ID")
    public Officer getById(@PathVariable Long id) {
        return officerService.getOfficerById(id);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete officer by ID")
    public void delete(@PathVariable Long id) {
        officerService.deleteOfficer(id);
    }

    @GetMapping
    @Operation(summary = "List all officers")
    public List<Officer> getAll() {
        return officerService.getAllOfficers();
    }
} 
