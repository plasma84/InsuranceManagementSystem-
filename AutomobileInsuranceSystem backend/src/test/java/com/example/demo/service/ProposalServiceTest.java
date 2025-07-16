package com.example.demo.service;

import com.example.demo.entity.Proposal;
import com.example.demo.entity.User;
import com.example.demo.enums.ProposalStatus;
import com.example.demo.exception.UserNotFoundException;
import com.example.demo.repository.ProposalRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProposalServiceTest {

    @Mock
    private ProposalRepository proposalRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProposalService proposalService;

    private User testUser;
    private Proposal testProposal;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setName("John Doe");
        testUser.setEmail("john.doe@example.com");

        testProposal = new Proposal();
        testProposal.setId(1L);
        testProposal.setVehicleNumber("KA01AB1234");
        testProposal.setVehicleType("CAR");
        testProposal.setPolicyPackage("COMPREHENSIVE");
        testProposal.setPremiumAmount(15000.00);
        testProposal.setSubmissionDate(LocalDate.now());
        testProposal.setStatus(ProposalStatus.PROPOSAL_SUBMITTED);
        testProposal.setUser(testUser);
    }

    @Test
    void testSubmitProposal_Success() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(proposalRepository.save(any(Proposal.class))).thenReturn(testProposal);

        // When
        Proposal result = proposalService.submitProposal(1L, testProposal);

        // Then
        assertNotNull(result);
        assertEquals(testProposal.getVehicleNumber(), result.getVehicleNumber());
        assertEquals(testUser, result.getUser());
        assertEquals(ProposalStatus.PROPOSAL_SUBMITTED, result.getStatus());
        assertNotNull(result.getSubmissionDate());
        
        verify(userRepository, times(1)).findById(1L);
        verify(proposalRepository, times(1)).save(any(Proposal.class));
    }

    @Test
    void testSubmitProposal_UserNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(UserNotFoundException.class, () -> {
            proposalService.submitProposal(999L, testProposal);
        });
        
        verify(userRepository, times(1)).findById(999L);
        verify(proposalRepository, never()).save(any(Proposal.class));
    }

    @Test
    void testGetProposalsByUser_Success() {
        // Given
        Proposal proposal2 = new Proposal();
        proposal2.setId(2L);
        proposal2.setVehicleNumber("KA02CD5678");
        proposal2.setUser(testUser);
        
        List<Proposal> expectedProposals = Arrays.asList(testProposal, proposal2);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(proposalRepository.findByUser(testUser)).thenReturn(expectedProposals);

        // When
        List<Proposal> result = proposalService.getProposalsByUser(1L);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(expectedProposals, result);
        verify(proposalRepository, times(1)).findByUser(testUser);
    }

    @Test
    void testGetProposalById_Success() {
        // Given
        when(proposalRepository.findById(1L)).thenReturn(Optional.of(testProposal));

        // When
        Proposal result = proposalService.getProposalById(1L);

        // Then
        assertNotNull(result);
        assertEquals(testProposal.getId(), result.getId());
        assertEquals(testProposal.getVehicleNumber(), result.getVehicleNumber());
        verify(proposalRepository, times(1)).findById(1L);
    }

    @Test
    void testGetProposalById_NotFound() {
        // Given
        when(proposalRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(NoSuchElementException.class, () -> {
            proposalService.getProposalById(999L);
        });
        verify(proposalRepository, times(1)).findById(999L);
    }

    @Test
    void testGetSubmittedProposals_Success() {
        // Given
        Proposal proposal2 = new Proposal();
        proposal2.setId(2L);
        proposal2.setVehicleNumber("KA02CD5678");
        
        List<Proposal> expectedProposals = Arrays.asList(testProposal, proposal2);
        when(proposalRepository.findByStatus(ProposalStatus.PROPOSAL_SUBMITTED)).thenReturn(expectedProposals);

        // When
        List<Proposal> result = proposalService.getSubmittedProposals();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(expectedProposals, result);
        verify(proposalRepository, times(1)).findByStatus(ProposalStatus.PROPOSAL_SUBMITTED);
    }

    @Test
    void testSubmitProposal_SetsCorrectDefaults() {
        // Given
        Proposal proposalWithoutDefaults = new Proposal();
        proposalWithoutDefaults.setVehicleNumber("KA01AB1234");
        proposalWithoutDefaults.setVehicleType("CAR");
        proposalWithoutDefaults.setPolicyPackage("COMPREHENSIVE");
        proposalWithoutDefaults.setPremiumAmount(15000.00);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(proposalRepository.save(any(Proposal.class))).thenAnswer(invocation -> {
            Proposal savedProposal = invocation.getArgument(0);
            savedProposal.setId(1L);
            return savedProposal;
        });

        // When
        Proposal result = proposalService.submitProposal(1L, proposalWithoutDefaults);

        // Then
        assertNotNull(result);
        assertEquals(testUser, result.getUser());
        assertEquals(ProposalStatus.PROPOSAL_SUBMITTED, result.getStatus());
        assertNotNull(result.getSubmissionDate());
        assertEquals(LocalDate.now(), result.getSubmissionDate());
    }
}
