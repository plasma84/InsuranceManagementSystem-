package com.example.demo.repository;

import com.example.demo.entity.Officer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OfficerRepository extends JpaRepository<Officer, Long> {
    Optional<Officer> findByEmail(String email);
}