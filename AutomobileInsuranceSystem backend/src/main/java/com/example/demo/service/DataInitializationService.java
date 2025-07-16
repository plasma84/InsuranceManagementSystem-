package com.example.demo.service;

import com.example.demo.entity.Officer;
import com.example.demo.entity.User;
import com.example.demo.entity.Claim;
import com.example.demo.entity.Proposal;
import com.example.demo.enums.ProposalStatus;
import com.example.demo.repository.ClaimRepository;
import com.example.demo.repository.ProposalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Random;

@Service
public class DataInitializationService implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializationService.class);
    
    // Constants for repeated string literals
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_UNDER_REVIEW = "UNDER_REVIEW";
    private static final String STATUS_REJECTED = "REJECTED";

    private final UserService userService;
    private final OfficerService officerService;
    private final PasswordEncoder passwordEncoder;
    private final ClaimRepository claimRepository;
    private final ProposalRepository proposalRepository;
    private final Random random;

    // Constructor injection instead of field injection
    public DataInitializationService(UserService userService, 
                                   OfficerService officerService,
                                   PasswordEncoder passwordEncoder,
                                   ClaimRepository claimRepository,
                                   ProposalRepository proposalRepository) {
        this.userService = userService;
        this.officerService = officerService;
        this.passwordEncoder = passwordEncoder;
        this.claimRepository = claimRepository;
        this.proposalRepository = proposalRepository;
        this.random = new Random();
    }

    @Override
    public void run(String... args) throws Exception {
        initializeSampleData();
    }

    private void createUserIfNotExists(String email, String name, String address,
                                       LocalDate dateOfBirth, String aadhaarNumber,
                                       String panNumber, String password) {
        if (userService.findByEmail(email) == null) {
            User user = new User();
            user.setName(name);
            user.setAddress(address);
            user.setDateOfBirth(dateOfBirth);
            user.setAadhaarNumber(aadhaarNumber);
            user.setPanNumber(panNumber);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole("USER");
            userService.saveUser(user);
            logger.info("Sample User created: {} ({})", user.getName(), user.getEmail());
        }
    }

    private void createOfficerIfNotExists(String email, String name, String password) {
        if (officerService.findByEmail(email) == null) {
            Officer officer = new Officer();
            officer.setName(name);
            officer.setEmail(email);
            officer.setPassword(passwordEncoder.encode(password));
            officerService.saveOfficer(officer);
            logger.info("Sample Officer created: {} ({})", officer.getName(), officer.getEmail());
        }
    }

    private void initializeSampleData() {
        try {
            // Create sample users if they don't exist
            createUserIfNotExists("john.doe@example.com", "John Doe",
                "123 Main Street, Mumbai, Maharashtra 400001",
                LocalDate.of(1985, 6, 15), "123456789012", "ABCDE1234F", "TestPassword123!");

            createUserIfNotExists("jane.smith@example.com", "Jane Smith",
                "456 Oak Avenue, Delhi, Delhi 110001",
                LocalDate.of(1990, 3, 22), "987654321098", "XYZNP5678G", "TestPassword456!");

            createUserIfNotExists("alex.johnson@example.com", "Alex Johnson",
                "789 Pine Road, Bangalore, Karnataka 560001",
                LocalDate.of(1988, 11, 30), "456789123456", "PQRST9012H", "AlexPass789!");

            createUserIfNotExists("maria.garcia@example.com", "Maria Garcia",
                "321 Cedar Lane, Chennai, Tamil Nadu 600001",
                LocalDate.of(1992, 8, 14), "789012345678", "LMNOP3456J", "MariaSecure456!");

            createUserIfNotExists("david.wilson@example.com", "David Wilson",
                "654 Maple Drive, Pune, Maharashtra 411001",
                LocalDate.of(1983, 2, 28), "234567890123", "QWERT7890K", "DavidPass321!");

            createUserIfNotExists("priya.sharma@example.com", "Priya Sharma",
                "987 Birch Street, Hyderabad, Telangana 500001",
                LocalDate.of(1995, 7, 19), "567890123456", "ASDFG2345L", "PriyaSecure123!");

            createUserIfNotExists("robert.brown@example.com", "Robert Brown",
                "147 Elm Avenue, Kolkata, West Bengal 700001",
                LocalDate.of(1980, 12, 5), "890123456789", "ZXCVB6789M", "RobertPass987!");

            createUserIfNotExists("sarah.davis@example.com", "Sarah Davis",
                "258 Willow Court, Ahmedabad, Gujarat 380001",
                LocalDate.of(1987, 4, 16), "345678901234", "HJKLM4567N", "SarahSecure654!");

            // Create sample officers if they don't exist
            createOfficerIfNotExists("officer1@insurance.com", "Michael Johnson", "OfficerSecure789!");
            createOfficerIfNotExists("officer2@insurance.com", "Lisa Anderson", "Officer456Pass!");
            createOfficerIfNotExists("admin@insurance.com", "Sarah Wilson", "AdminSecure321!");
            createOfficerIfNotExists("supervisor@insurance.com", "James Thompson", "SupervisorPass654!");

            // Create sample claims for testing
            createSampleClaims();

            logger.info("Sample data initialization completed!");

        } catch (Exception e) {
            logger.error("Error initializing sample data: {}", e.getMessage());
        }
    }
    
    private void createSampleClaims() {
        try {
            // Only create claims if none exist
            if (claimRepository.count() == 0) {
                logger.info("Creating sample claims...");
                
                // Get some users and their proposals
                User user1 = userService.findByEmail("john.doe@example.com");
                User user2 = userService.findByEmail("jane.smith@example.com");
                User user3 = userService.findByEmail("michael.johnson@example.com");
                
                // Create sample proposals if they don't exist
                if (user1 != null && proposalRepository.count() == 0) {
                    createSampleProposal(user1, "Car", "MH01AB1234", "Comprehensive", 50000.0);
                    createSampleProposal(user1, "Bike", "MH02CD5678", "Basic Third Party", 15000.0);
                    createSampleProposal(user2, "Car", "MH03EF9012", "Comprehensive Plus", 75000.0);
                    createSampleProposal(user3, "Car", "MH04GH3456", "Premium", 100000.0);
                }
                
                // Get proposals and create claims
                List<Proposal> proposals = proposalRepository.findAll();
                if (!proposals.isEmpty()) {
                    // Create various types of claims
                    createClaimIfNotExists(user1, proposals.get(0), "Vehicle damaged in accident", STATUS_PENDING);
                    createClaimIfNotExists(user1, proposals.get(1), "Theft of vehicle accessories", STATUS_APPROVED);
                    createClaimIfNotExists(user2, proposals.get(2), "Natural calamity damage", STATUS_UNDER_REVIEW);
                    createClaimIfNotExists(user3, proposals.get(3), "Third party liability claim", STATUS_REJECTED);
                    
                    // Create additional pending claims for officers to review
                    createClaimIfNotExists(user2, proposals.get(0), "Fire damage to vehicle", STATUS_PENDING);
                    createClaimIfNotExists(user3, proposals.get(1), "Collision with another vehicle", STATUS_PENDING);
                    
                    logger.info("Created {} sample claims", claimRepository.count());
                }
            } else {
                logger.info("Claims already exist, skipping sample claim creation");
            }
        } catch (Exception e) {
            logger.error("Error creating sample claims: {}", e.getMessage());
        }
    }
    
    private void createSampleProposal(User user, String vehicleType, String vehicleNumber, 
                                     String policyPackage, Double premiumAmount) {
        try {
            Proposal proposal = new Proposal();
            proposal.setUser(user);
            proposal.setVehicleType(vehicleType);
            proposal.setVehicleNumber(vehicleNumber);
            proposal.setPolicyPackage(policyPackage);
            proposal.setPremiumAmount(premiumAmount);
            proposal.setSubmissionDate(LocalDate.now().minusDays(random.nextLong(30) + 1));
            proposal.setStatus(ProposalStatus.ACTIVE);
            proposal.setPaymentDate(LocalDate.now().minusDays(random.nextLong(15) + 1));
            proposal.setTransactionId("TXN" + System.currentTimeMillis() + random.nextInt(1000));
            
            proposalRepository.save(proposal);
            logger.info("Created sample proposal for user: {} - {}", user.getEmail(), vehicleNumber);
        } catch (Exception e) {
            logger.error("Error creating sample proposal: {}", e.getMessage());
        }
    }
    
    private void createClaimIfNotExists(User user, Proposal proposal, String reason, String status) {
        try {
            Claim claim = new Claim();
            claim.setUser(user);
            claim.setProposal(proposal);
            claim.setReason(reason);
            claim.setStatus(status);
            claim.setDateFiled(LocalDate.now().minusDays(random.nextLong(10) + 1));
            
            claimRepository.save(claim);
            logger.info("Created sample claim for user: {} - {}", user.getEmail(), reason);
        } catch (Exception e) {
            logger.error("Error creating sample claim: {}", e.getMessage());
        }
    }
}
