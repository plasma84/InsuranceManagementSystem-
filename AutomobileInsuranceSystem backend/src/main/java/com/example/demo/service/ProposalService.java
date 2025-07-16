package com.example.demo.service;

import com.example.demo.entity.Proposal;
import com.example.demo.entity.User;
import com.example.demo.enums.ProposalStatus;
import com.example.demo.exception.UserNotFoundException;
import com.example.demo.repository.ProposalRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ProposalService {

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private UserRepository userRepository;

    public Proposal submitProposal(Long userId, Proposal proposal) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        proposal.setUser(user);
        proposal.setStatus(ProposalStatus.PROPOSAL_SUBMITTED);
        proposal.setSubmissionDate(LocalDate.now());
        proposal.setPremiumAmount(calculatePremium(proposal));

        return proposalRepository.save(proposal);
    }

    private double calculatePremium(Proposal proposal) {
        double baseRate = switch (proposal.getVehicleType().toLowerCase()) {
            case "truck" -> 10000;
            case "motorcycle" -> 3000;
            case "camper van" -> 7000;
            default -> 5000;
        };

        return baseRate + (proposal.getPolicyPackage().equalsIgnoreCase("premium") ? 2500 : 1000);
    }

    public List<Proposal> getProposalsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        return proposalRepository.findByUser(user);
    }

    public Proposal getProposalById(Long id) {
        return proposalRepository.findById(id).orElseThrow();
    }
    public List<Proposal> getSubmittedProposals() {
        return proposalRepository.findByStatus(ProposalStatus.PROPOSAL_SUBMITTED);
    }

    public Proposal approveProposal(Long proposalId) {
        Proposal proposal = getProposalById(proposalId);
        proposal.setStatus(ProposalStatus.QUOTE_GENERATED);
        return proposalRepository.save(proposal);
    }

    public Proposal rejectProposal(Long proposalId) {
        Proposal proposal = getProposalById(proposalId);
        proposal.setStatus(ProposalStatus.EXPIRED);
        return proposalRepository.save(proposal);
    }
    public Proposal generateQuote(Long proposalId) {
        Proposal proposal = getProposalById(proposalId);
        if (proposal.getStatus() != ProposalStatus.QUOTE_GENERATED) {
            throw new IllegalStateException("Quote not approved yet.");
        }
        return proposal; // already contains quote info
    }

    public Proposal processPayment(Long proposalId, String transactionId) {
        Proposal proposal = getProposalById(proposalId);
        if (proposal.getStatus() != ProposalStatus.QUOTE_GENERATED) {
            throw new IllegalStateException("Payment allowed only for approved quotes.");
        }
        proposal.setStatus(ProposalStatus.ACTIVE);
        proposal.setPaymentDate(LocalDate.now());
        proposal.setTransactionId(transactionId);
        return proposalRepository.save(proposal);
    }

    public void deleteProposal(Long proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found with id: " + proposalId));
        
        // Optional: Add business logic to check if proposal can be deleted
        // For example, only allow deletion of certain statuses
        if (proposal.getStatus() == ProposalStatus.ACTIVE) {
            throw new IllegalStateException("Cannot delete active policies. Please contact support for policy cancellation.");
        }
        
        proposalRepository.delete(proposal);
    }
}
