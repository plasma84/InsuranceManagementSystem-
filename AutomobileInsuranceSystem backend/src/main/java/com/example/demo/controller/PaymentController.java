package com.example.demo.controller;

import com.example.demo.entity.Payment;
import com.example.demo.service.InvoiceService;
import com.example.demo.repository.PaymentRepository;
import com.example.demo.repository.ProposalRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.entity.User;
import com.example.demo.entity.Proposal;
import com.example.demo.repository.ClaimRepository;
import com.example.demo.entity.Claim;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

 @Autowired
 private InvoiceService invoiceService;

 @Autowired
 private PaymentRepository paymentRepository;

 @GetMapping("/invoice/{paymentId}")
 public ResponseEntity<FileSystemResource> downloadInvoice(@PathVariable Long paymentId) {
     Payment payment = paymentRepository.findById(paymentId).orElse(null);

     if (payment == null || payment.getUser() == null || payment.getProposal() == null) {
         return ResponseEntity.status(500).body(null); // Avoid infinite recursion or null pointers
     }

     String filename = invoiceService.generateInvoice(payment);
     File file = new File(filename);

     if (!file.exists()) {
         return ResponseEntity.notFound().build();
     }

     FileSystemResource resource = new FileSystemResource(file);
     return ResponseEntity.ok()
             .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + file.getName())
             .contentLength(file.length())
             .contentType(MediaType.APPLICATION_PDF)
             .body(resource);
 }
 @Autowired
 private PaymentRepository paymentRepository1;

 @Autowired
 private UserRepository userRepository;

 @Autowired
 private ProposalRepository proposalRepository;
 @Autowired
 private ClaimRepository claimRepository;

 @PostMapping("/make")
 public ResponseEntity<String> makePayment(@RequestParam Long userId,
                                           @RequestParam Long proposalId,
                                           @RequestParam Double amount) {
     User user = userRepository.findById(userId).orElse(null);
     Proposal proposal = proposalRepository.findById(proposalId).orElse(null);

     if (user == null || proposal == null) {
         return ResponseEntity.badRequest().body("Invalid user or proposal ID");
     }

     Payment payment = new Payment();
     payment.setUser(user);
     payment.setProposal(proposal);
     payment.setAmount(amount);
     payment.setPaymentDate(LocalDate.now());

     Payment saved = paymentRepository.save(payment);
     return ResponseEntity.ok("Payment recorded with ID: " + saved.getId());
 }
 @PostMapping("/claim")
 public ResponseEntity<String> submitClaim(@RequestParam Long userId,
                                           @RequestParam Long proposalId,
                                           @RequestParam String reason) {
     User user = userRepository.findById(userId).orElse(null);
     Proposal proposal = proposalRepository.findById(proposalId).orElse(null);

     if (user == null || proposal == null) {
         return ResponseEntity.badRequest().body("Invalid user or proposal ID");
     }

     Claim claim = new Claim();
     claim.setUser(user);
     claim.setProposal(proposal);
     claim.setReason(reason);
     claim.setStatus("PENDING");
     claim.setDateFiled(LocalDate.now());

     claimRepository.save(claim);
     return ResponseEntity.ok("Claim submitted successfully.");
 }

 @GetMapping("/claims/user/{userId}")
 public ResponseEntity<List<Claim>> getUserClaims(@PathVariable Long userId) {
     User user = userRepository.findById(userId).orElse(null);
     if (user == null) {
         return ResponseEntity.badRequest().build();
     }
     
     List<Claim> claims = claimRepository.findAll().stream()
             .filter(claim -> claim.getUser().getId().equals(userId))
             .toList();
     
     return ResponseEntity.ok(claims);
 }

 @GetMapping("/claims")
 public ResponseEntity<List<Claim>> getAllClaims() {
     return ResponseEntity.ok(claimRepository.findAll());
 }

 @PutMapping("/claim/{claimId}/status")
 public ResponseEntity<String> updateClaimStatus(@PathVariable Long claimId,
                                                 @RequestParam String status) {
     Claim claim = claimRepository.findById(claimId).orElse(null);
     if (claim == null) {
         return ResponseEntity.notFound().build();
     }
     claim.setStatus(status.toUpperCase());
     claimRepository.save(claim);
     return ResponseEntity.ok("Claim status updated to: " + status);
 }

}
