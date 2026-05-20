package com.documind.repository;

import com.documind.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /** Find user by email – used by Spring Security UserDetailsService. */
    Optional<User> findByEmail(String email);

    /** Check if an email is already registered (used during sign-up). */
    boolean existsByEmail(String email);
}
