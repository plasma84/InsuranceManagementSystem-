package com.example.demo.repository;


import com.example.demo.entity.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
 // You can add custom query methods here if needed
}

