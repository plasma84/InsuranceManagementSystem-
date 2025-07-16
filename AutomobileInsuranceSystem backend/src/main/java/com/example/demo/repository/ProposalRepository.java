package com.example.demo.repository;

import com.example.demo.entity.Proposal;
import com.example.demo.entity.User;
import com.example.demo.enums.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    List<Proposal> findByUser(User user);
    List<Proposal> findByStatus(ProposalStatus status);
}