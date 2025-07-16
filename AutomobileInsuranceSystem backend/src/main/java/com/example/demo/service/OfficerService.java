package com.example.demo.service;

import com.example.demo.entity.Officer;
import com.example.demo.exception.InvalidCredentialsException;
import com.example.demo.exception.UserNotFoundException;
import com.example.demo.repository.OfficerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OfficerService {

    @Autowired
    private OfficerRepository officerRepository;

    public Officer registerOfficer(Officer officer) {
        return officerRepository.save(officer);
    }

    public Officer login(String email, String password) {
        return officerRepository.findByEmail(email)
                .filter(o -> o.getPassword().equals(password))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid officer credentials."));
    }

    public List<Officer> getAllOfficers() {
        return officerRepository.findAll();
    }

    public Officer getOfficerById(Long id) {
        return officerRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Officer not found with id: " + id));
    }

    public Officer findByEmail(String email) {
        return officerRepository.findByEmail(email).orElse(null);
    }

    public Officer saveOfficer(Officer officer) {
        return officerRepository.save(officer);
    }

    public void deleteOfficer(Long id) {
        if (!officerRepository.existsById(id)) {
            throw new UserNotFoundException("Officer not found with id: " + id);
        }
        officerRepository.deleteById(id);
    }
}
