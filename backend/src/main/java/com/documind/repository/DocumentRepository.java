package com.documind.repository;

import com.documind.model.Document;
import com.documind.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    /** Return all documents belonging to a specific user, newest first. */
    List<Document> findByUserOrderByUploadedAtDesc(User user);

    /** Overload accepting user ID directly to avoid extra User lookup. */
    List<Document> findByUserIdOrderByUploadedAtDesc(Long userId);
}
