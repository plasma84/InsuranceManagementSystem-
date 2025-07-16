package com.example.demo.controller;

import com.example.demo.entity.Proposal;
import com.example.demo.entity.User;
import com.example.demo.service.ProposalService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProposalController.class)
@ActiveProfiles("test")
class ProposalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProposalService proposalService;

    @Autowired
    private ObjectMapper objectMapper;

    private Proposal testProposal;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");

        testProposal = new Proposal();
        testProposal.setId(1L);
        testProposal.setVehicleNumber("KA01AB1234");
        testProposal.setVehicleType("car");
        testProposal.setPolicyPackage("premium");
        testProposal.setPremiumAmount(7500.0);
        testProposal.setUser(testUser);
    }

    @Test
    void testSubmitProposal() throws Exception {
        // Given
        Proposal newProposal = new Proposal();
        newProposal.setVehicleNumber("KA01AB1234");
        newProposal.setVehicleType("car");
        newProposal.setPolicyPackage("premium");

        when(proposalService.submitProposal(eq(1L), any(Proposal.class))).thenReturn(testProposal);

        // When & Then
        mockMvc.perform(post("/api/proposals/submit/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newProposal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicleNumber").value("KA01AB1234"))
                .andExpect(jsonPath("$.vehicleType").value("car"))
                .andExpect(jsonPath("$.policyPackage").value("premium"))
                .andExpect(jsonPath("$.premiumAmount").value(7500.0));
    }

    @Test
    void testGetUserProposals() throws Exception {
        // Given
        List<Proposal> proposals = Arrays.asList(testProposal);
        when(proposalService.getProposalsByUser(1L)).thenReturn(proposals);

        // When & Then
        mockMvc.perform(get("/api/proposals/user/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].vehicleNumber").value("KA01AB1234"))
                .andExpect(jsonPath("$[0].premiumAmount").value(7500.0));
    }

    @Test
    void testGetProposalById() throws Exception {
        // Given
        when(proposalService.getProposalById(1L)).thenReturn(testProposal);

        // When & Then
        mockMvc.perform(get("/api/proposals/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.vehicleNumber").value("KA01AB1234"))
                .andExpect(jsonPath("$.vehicleType").value("car"));
    }

    @Test
    void testSubmitProposalWithInvalidData() throws Exception {
        // Given
        Proposal invalidProposal = new Proposal();
        // Missing required fields

        when(proposalService.submitProposal(eq(1L), any(Proposal.class)))
                .thenThrow(new IllegalArgumentException("Invalid proposal data"));

        // When & Then
        mockMvc.perform(post("/api/proposals/submit/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidProposal)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetProposalsForNonExistentUser() throws Exception {
        // Given
        when(proposalService.getProposalsByUser(999L))
                .thenThrow(new RuntimeException("User not found"));

        // When & Then
        mockMvc.perform(get("/api/proposals/user/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError());
    }
}
