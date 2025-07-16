package com.example.demo.controller;


import com.example.demo.entity.Proposal;
import com.example.demo.service.ProposalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/officer")
@Tag(name = "Officer Panel", description = "Approve or Reject Proposals")
public class OfficerrController {

    @Autowired
    private ProposalService proposalService;

    @GetMapping("/proposals")
    @Operation(summary = "View all proposals with status PROPOSAL_SUBMITTED")
    public List<Proposal> getSubmittedProposals() {
        return proposalService.getSubmittedProposals();
    }

    @PutMapping("/approve/{proposalId}")
    @Operation(summary = "Approve a proposal (changes status to QUOTE_GENERATED)")
    public Proposal approveProposal(@PathVariable Long proposalId) {
        return proposalService.approveProposal(proposalId);
    }

    @PutMapping("/reject/{proposalId}")
    @Operation(summary = "Reject a proposal (changes status to EXPIRED)")
    public Proposal rejectProposal(@PathVariable Long proposalId) {
        return proposalService.rejectProposal(proposalId);
    }
}
