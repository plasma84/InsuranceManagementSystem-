package com.example.demo.entity;


import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Payment {

 @Id
 @GeneratedValue(strategy = GenerationType.IDENTITY)
 private Long id;

 private double amount;

 private LocalDate paymentDate;

 @ManyToOne
 @JoinColumn(name = "user_id")
 private User user;

 @OneToOne
 @JoinColumn(name = "proposal_id")
 private Proposal proposal;

 // Getters and Setters
 public Long getId() { return id; }
 public void setId(Long id) { this.id = id; }

 public double getAmount() { return amount; }
 public void setAmount(double amount) { this.amount = amount; }

 public LocalDate getPaymentDate() { return paymentDate; }
 public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }

 public User getUser() { return user; }
 public void setUser(User user) { this.user = user; }

 public Proposal getProposal() { return proposal; }
 public void setProposal(Proposal proposal) { this.proposal = proposal; }
}
