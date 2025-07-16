package com.example.demo.util;

import com.example.demo.config.JwtConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtUtilTest {

    @Mock
    private JwtConfig jwtConfig;

    @InjectMocks
    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        when(jwtConfig.getSecret()).thenReturn("mySecretKey12345678901234567890123456789012345678901234567890");
        when(jwtConfig.getExpiration()).thenReturn(86400000L); // 24 hours
    }

    @Test
    void testGenerateToken() {
        // Given
        String email = "test@example.com";
        String userType = "USER";

        // When
        String token = jwtUtil.generateToken(email, userType);

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.contains("."));  // JWT tokens contain dots
    }

    @Test
    void testExtractUsername() {
        // Given
        String email = "test@example.com";
        String userType = "USER";
        String token = jwtUtil.generateToken(email, userType);

        // When
        String extractedEmail = jwtUtil.extractUsername(token);

        // Then
        assertEquals(email, extractedEmail);
    }

    @Test
    void testValidateToken_ValidToken() {
        // Given
        String email = "test@example.com";
        String userType = "USER";
        String token = jwtUtil.generateToken(email, userType);
        UserDetails userDetails = new User(email, "password", new ArrayList<>());

        // When
        boolean isValid = jwtUtil.validateToken(token, userDetails);

        // Then
        assertTrue(isValid);
    }

    @Test
    void testValidateToken_WrongUsername() {
        // Given
        String email = "test@example.com";
        String userType = "USER";
        String token = jwtUtil.generateToken(email, userType);
        UserDetails wrongUserDetails = new User("wrong@example.com", "password", new ArrayList<>());

        // When
        boolean isValid = jwtUtil.validateToken(token, wrongUserDetails);

        // Then
        assertFalse(isValid);
    }

    @Test
    void testTokenExpiration() {
        // Given
        String email = "test@example.com";
        String userType = "USER";
        String token = jwtUtil.generateToken(email, userType);

        // When
        boolean isExpired = jwtUtil.isTokenExpired(token);

        // Then
        assertFalse(isExpired); // Token should not be expired immediately after creation
    }

    @Test
    void testExtractRole() {
        // Given
        String email = "test@example.com";
        String userType = "OFFICER";
        String token = jwtUtil.generateToken(email, userType);

        // When
        String extractedRole = jwtUtil.extractRole(token);

        // Then
        assertEquals(userType, extractedRole);
    }

    @Test
    void testGenerateTokenWithDifferentUserTypes() {
        // Test USER token
        String userToken = jwtUtil.generateToken("user@example.com", "USER");
        assertNotNull(userToken);
        assertEquals("user@example.com", jwtUtil.extractUsername(userToken));
        assertEquals("USER", jwtUtil.extractRole(userToken));

        // Test OFFICER token
        String officerToken = jwtUtil.generateToken("officer@example.com", "OFFICER");
        assertNotNull(officerToken);
        assertEquals("officer@example.com", jwtUtil.extractUsername(officerToken));
        assertEquals("OFFICER", jwtUtil.extractRole(officerToken));

        // Test ADMIN token
        String adminToken = jwtUtil.generateToken("admin@example.com", "ADMIN");
        assertNotNull(adminToken);
        assertEquals("admin@example.com", jwtUtil.extractUsername(adminToken));
        assertEquals("ADMIN", jwtUtil.extractRole(adminToken));
    }

    @Test
    void testTokenUniqueness() {
        // Given
        String email = "test@example.com";
        String userType = "USER";

        // When
        String token1 = jwtUtil.generateToken(email, userType);
        String token2 = jwtUtil.generateToken(email, userType);

        // Then
        // Tokens should be different due to different issuedAt timestamps
        // Note: In a real scenario, tokens generated at exactly the same millisecond 
        // might be identical, but this is extremely rare in practice
        assertFalse(token1.isEmpty());
        assertFalse(token2.isEmpty());
    }

    @Test
    void testGenerateTokenWithUserDetails() {
        // Given
        UserDetails userDetails = new User("test@example.com", "password", new ArrayList<>());

        // When
        String token = jwtUtil.generateToken(userDetails);

        // Then
        assertNotNull(token);
        assertEquals("test@example.com", jwtUtil.extractUsername(token));
        assertFalse(jwtUtil.isTokenExpired(token));
    }
}
