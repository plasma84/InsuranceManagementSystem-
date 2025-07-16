package com.example.demo.controller;


import com.example.demo.entity.Proposal;
import com.example.demo.dto.PaymentRequest;
import com.example.demo.service.ProposalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/quotes")
@Tag(name = "Quote and Payment", description = "Generate quotes and process payments")
public class QuoteController {

    @Autowired
    private ProposalService proposalService;

    @GetMapping("/{proposalId}")
    @Operation(summary = "Get quote details for approved proposal")
    public Proposal getQuote(@PathVariable Long proposalId) {
        return proposalService.generateQuote(proposalId);
    }

    @PostMapping("/pay/{proposalId}")
    @Operation(summary = "Process payment for a quote and activate policy")
    public Proposal makePayment(@PathVariable Long proposalId, @RequestBody PaymentRequest request) {
        return proposalService.processPayment(proposalId, request.getTransactionId());
    }
}
