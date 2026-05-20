package com.documind.service;

import com.documind.model.Document;
import com.documind.model.User;
import com.documind.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserService userService;

    private final Path rootPath = Paths.get("uploads");

    public DocumentService() {
        try {
            Files.createDirectories(rootPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload folder!");
        }
    }

    public Document uploadDocument(Long userId, MultipartFile file) throws IOException {
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "unnamed.pdf";
        }

        // Clean name to prevent directory traversal
        String cleanedFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");

        Path userDir = rootPath.resolve(userId.toString());
        Files.createDirectories(userDir);

        Path finalPath = userDir.resolve(System.currentTimeMillis() + "_" + cleanedFilename);
        Files.copy(file.getInputStream(), finalPath);

        Document doc = new Document(user, originalFilename, finalPath.toAbsolutePath().toString());
        return documentRepository.save(doc);
    }

    public List<Document> getUserDocuments(Long userId) {
        return documentRepository.findByUserIdOrderByUploadedAtDesc(userId);
    }

    public Document updateStatus(Long documentId, Document.Status status) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setStatus(status);
        return documentRepository.save(doc);
    }
}
