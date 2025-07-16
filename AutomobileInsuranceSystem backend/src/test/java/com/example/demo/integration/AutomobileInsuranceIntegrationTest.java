package com.example.demo.integration;

import com.example.demo.entity.User;
import com.example.demo.entity.Proposal;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.ProposalRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class AutomobileInsuranceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProposalRepository proposalRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Clean up
        proposalRepository.deleteAll();
        userRepository.deleteAll();

        // Create test user
        testUser = new User();
        testUser.setName("John Doe");
        testUser.setEmail("john.doe@example.com");
        testUser.setPassword("password123");
        testUser.setAddress("123 Test Street");
        testUser.setDateOfBirth(LocalDate.of(1990, 1, 1));
        testUser.setAadhaarNumber("123456789012");
        testUser.setPanNumber("ABCDE1234F");
        testUser = userRepository.save(testUser);
    }

    @Test
    void testCompleteProposalWorkflow() throws Exception {
        // Step 1: Submit a proposal
        Proposal proposal = new Proposal();
        proposal.setVehicleNumber("KA01AB1234");
        proposal.setVehicleType("car");
        proposal.setPolicyPackage("premium");

        mockMvc.perform(post("/api/proposals/submit/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(proposal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicleNumber").value("KA01AB1234"))
                .andExpect(jsonPath("$.status").value("PROPOSAL_SUBMITTED"))
                .andExpect(jsonPath("$.premiumAmount").value(7500.0)); // 5000 base + 2500 premium

        // Step 2: Get user proposals
        mockMvc.perform(get("/api/proposals/user/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].vehicleNumber").value("KA01AB1234"));
    }

    @Test
    void testSubmitMultipleProposals() throws Exception {
        // Submit first proposal
        Proposal proposal1 = new Proposal();
        proposal1.setVehicleNumber("KA01AB1234");
        proposal1.setVehicleType("truck");
        proposal1.setPolicyPackage("basic");

        mockMvc.perform(post("/api/proposals/submit/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(proposal1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premiumAmount").value(11000.0)); // 10000 base + 1000 basic

        // Submit second proposal
        Proposal proposal2 = new Proposal();
        proposal2.setVehicleNumber("KA02CD5678");
        proposal2.setVehicleType("motorcycle");
        proposal2.setPolicyPackage("premium");

        mockMvc.perform(post("/api/proposals/submit/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(proposal2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premiumAmount").value(5500.0)); // 3000 base + 2500 premium

        // Verify both proposals exist
        mockMvc.perform(get("/api/proposals/user/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void testPremiumCalculation() throws Exception {
        // Test truck premium calculation
        Proposal truckProposal = new Proposal();
        truckProposal.setVehicleNumber("TRUCK001");
        truckProposal.setVehicleType("TRUCK");
        truckProposal.setPolicyPackage("premium");

        mockMvc.perform(post("/api/proposals/submit/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(truckProposal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premiumAmount").value(12500.0)); // 10000 + 2500

        // Test motorcycle premium calculation
        Proposal motorcycleProposal = new Proposal();
        motorcycleProposal.setVehicleNumber("BIKE001");
        motorcycleProposal.setVehicleType("motorcycle");
        motorcycleProposal.setPolicyPackage("basic");

        mockMvc.perform(post("/api/proposals/submit/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(motorcycleProposal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premiumAmount").value(4000.0)); // 3000 + 1000

        // Test camper van premium calculation
        Proposal camperProposal = new Proposal();
        camperProposal.setVehicleNumber("CAMPER001");
        camperProposal.setVehicleType("camper van");
        camperProposal.setPolicyPackage("premium");

        mockMvc.perform(post("/api/proposals/submit/" + testUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(camperProposal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.premiumAmount").value(9500.0)); // 7000 + 2500
    }

    @Test
    void testUserNotFound() throws Exception {
        Proposal proposal = new Proposal();
        proposal.setVehicleNumber("KA01AB1234");
        proposal.setVehicleType("car");
        proposal.setPolicyPackage("basic");

        mockMvc.perform(post("/api/proposals/submit/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(proposal)))
                .andExpect(status().isNotFound());
    }
}
