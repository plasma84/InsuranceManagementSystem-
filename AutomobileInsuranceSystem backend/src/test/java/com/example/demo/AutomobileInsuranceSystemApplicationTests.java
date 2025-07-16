package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AutomobileInsuranceSystemApplicationTests {

	@Test
	void contextLoads() {
		// This test ensures that the Spring application context loads successfully
		// Context loading is sufficient to verify the application starts correctly
	}
}
