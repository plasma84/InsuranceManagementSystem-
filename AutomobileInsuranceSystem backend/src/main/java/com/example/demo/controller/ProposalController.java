package com.example.demo.controller;

import com.example.demo.entity.Proposal;
import com.example.demo.service.ProposalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proposals")
@CrossOrigin(origins = "*")
@Tag(name = "Policy Proposal Management", description = "APIs for vehicle insurance proposals")
public class ProposalController {

    @Autowired
    private ProposalService proposalService;

    @PostMapping("/submit/{userId}")
    @Operation(summary = "Submit a new policy proposal for a user")
    public Proposal submitProposal(@PathVariable Long userId, @RequestBody Proposal proposal) {
        return proposalService.submitProposal(userId, proposal);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all proposals submitted by a user")
    public List<Proposal> getUserProposals(@PathVariable Long userId) {
        return proposalService.getProposalsByUser(userId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get proposal by ID")
    public Proposal getById(@PathVariable Long id) {
        return proposalService.getProposalById(id);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a policy proposal")
    public String deleteProposal(@PathVariable Long id) {
        try {
            proposalService.deleteProposal(id);
            return "Proposal deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete proposal: " + e.getMessage());
        }
    }
}
