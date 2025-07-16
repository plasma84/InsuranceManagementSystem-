package com.example.demo.controller;

import com.example.demo.dto.JwtResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.entity.Officer;
import com.example.demo.entity.User;
import com.example.demo.service.OfficerService;
import com.example.demo.service.UserService;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private OfficerService officerService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            String email = loginRequest.getEmail();
            String password = loginRequest.getPassword();
            String userType = loginRequest.getUserType();

            if ("USER".equalsIgnoreCase(userType)) {
                User user = userService.findByEmail(email);
                if (user != null && passwordEncoder.matches(password, user.getPassword())) {
                    String token = jwtUtil.generateToken(email, "USER");
                    return ResponseEntity.ok(new JwtResponse(token, email, "USER"));
                }
            } else if ("OFFICER".equalsIgnoreCase(userType)) {
                Officer officer = officerService.findByEmail(email);
                if (officer != null && passwordEncoder.matches(password, officer.getPassword())) {
                    String token = jwtUtil.generateToken(email, "OFFICER");
                    return ResponseEntity.ok(new JwtResponse(token, email, "OFFICER"));
                }
            } else if ("ADMIN".equalsIgnoreCase(userType)) {
                // Check if it's an admin user or officer with admin privileges
                Officer officer = officerService.findByEmail(email);
                if (officer != null && passwordEncoder.matches(password, officer.getPassword())) {
                    String token = jwtUtil.generateToken(email, "ADMIN");
                    return ResponseEntity.ok(new JwtResponse(token, email, "ADMIN"));
                }
            }

            return ResponseEntity.badRequest().body("Invalid credentials");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Login failed: " + e.getMessage());
        }
    }

    @PostMapping("/register/user")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            // Check if user already exists
            if (userService.findByEmail(user.getEmail()) != null) {
                return ResponseEntity.badRequest().body("Email already exists");
            }

            // Encode password
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRole("USER");
            
            User savedUser = userService.saveUser(user);
            return ResponseEntity.ok("User registered successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/register/officer")
    public ResponseEntity<?> registerOfficer(@RequestBody Officer officer) {
        try {
            // Check if officer already exists
            if (officerService.findByEmail(officer.getEmail()) != null) {
                return ResponseEntity.badRequest().body("Email already exists");
            }

            // Encode password
            officer.setPassword(passwordEncoder.encode(officer.getPassword()));
            
            Officer savedOfficer = officerService.saveOfficer(officer);
            return ResponseEntity.ok("Officer registered successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String username = jwtUtil.extractUsername(token);
                String role = jwtUtil.extractRole(token);
                
                if (!jwtUtil.isTokenExpired(token)) {
                    return ResponseEntity.ok(new JwtResponse(token, username, role));
                }
            }
            return ResponseEntity.badRequest().body("Invalid token");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Token validation failed: " + e.getMessage());
        }
    }
}
