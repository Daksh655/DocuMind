package com.documind.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a PDF document uploaded by a user.
 * The AI engine updates the status field as it processes the file.
 */
@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
public class Document {

    public enum Status {
        PENDING,    // Uploaded but not yet processed by the AI engine
        PROCESSED,  // Successfully chunked and embedded
        FAILED      // Processing error – see AI engine logs
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Owner of this document. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    /**
     * Local filesystem path (or future S3 key).
     * e.g. /uploads/42/lecture-notes.pdf
     */
    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    public Document(User user, String fileName, String filePath) {
        this.user = user;
        this.fileName = fileName;
        this.filePath = filePath;
        this.status = Status.PENDING;
    }
}
