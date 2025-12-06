package com.syncora.note.controller;

import com.syncora.common.exception.ResourceNotFoundException;
import com.syncora.common.response.ApiResponse;
import com.syncora.note.dto.CreateNoteRequest;
import com.syncora.note.dto.NoteDTO;
import com.syncora.note.dto.UpdateNoteRequest;
import com.syncora.note.service.NoteService;
import com.syncora.security.JwtProvider;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
@Tag(name = "Notes", description = "Notes management endpoints")
public class NoteController {

    private final NoteService noteService;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    private User getCurrentUser(HttpServletRequest req) {
        String token = req.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        String email = jwtProvider.extractEmail(token);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @PostMapping
    @Operation(summary = "Create a new note", description = "Creates a new note for the authenticated user")
    public ResponseEntity<ApiResponse<NoteDTO>> createNote(
            HttpServletRequest req,
            @Valid @RequestBody CreateNoteRequest request) {
        User user = getCurrentUser(req);
        NoteDTO note = noteService.createNote(request, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Note created successfully", note));
    }

    @PutMapping("/{noteId}")
    @Operation(summary = "Update a note", description = "Updates an existing note")
    public ResponseEntity<ApiResponse<NoteDTO>> updateNote(
            HttpServletRequest req,
            @PathVariable String noteId,
            @Valid @RequestBody UpdateNoteRequest request) {
        User user = getCurrentUser(req);
        NoteDTO note = noteService.updateNote(noteId, request, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Note updated successfully", note));
    }

    @DeleteMapping("/{noteId}")
    @Operation(summary = "Delete a note", description = "Deletes a note")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            HttpServletRequest req,
            @PathVariable String noteId) {
        User user = getCurrentUser(req);
        noteService.deleteNote(noteId, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Note deleted successfully", null));
    }

    @GetMapping("/{noteId}")
    @Operation(summary = "Get note by ID", description = "Retrieves a specific note")
    public ResponseEntity<ApiResponse<NoteDTO>> getNoteById(
            HttpServletRequest req,
            @PathVariable String noteId) {
        User user = getCurrentUser(req);
        NoteDTO note = noteService.getNoteById(noteId, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Note retrieved successfully", note));
    }

    @GetMapping
    @Operation(summary = "Get all notes", description = "Retrieves all notes for the user")
    public ResponseEntity<ApiResponse<List<NoteDTO>>> getAllNotes(HttpServletRequest req) {
        User user = getCurrentUser(req);
        List<NoteDTO> notes = noteService.getAllNotes(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notes retrieved successfully", notes));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active notes", description = "Retrieves non-archived notes")
    public ResponseEntity<ApiResponse<List<NoteDTO>>> getActiveNotes(HttpServletRequest req) {
        User user = getCurrentUser(req);
        List<NoteDTO> notes = noteService.getActiveNotes(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Active notes retrieved successfully", notes));
    }

    @GetMapping("/starred")
    @Operation(summary = "Get starred notes", description = "Retrieves starred notes")
    public ResponseEntity<ApiResponse<List<NoteDTO>>> getStarredNotes(HttpServletRequest req) {
        User user = getCurrentUser(req);
        List<NoteDTO> notes = noteService.getStarredNotes(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Starred notes retrieved successfully", notes));
    }

    @GetMapping("/archived")
    @Operation(summary = "Get archived notes", description = "Retrieves archived notes")
    public ResponseEntity<ApiResponse<List<NoteDTO>>> getArchivedNotes(HttpServletRequest req) {
        User user = getCurrentUser(req);
        List<NoteDTO> notes = noteService.getArchivedNotes(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Archived notes retrieved successfully", notes));
    }

    @GetMapping("/search")
    @Operation(summary = "Search notes", description = "Searches notes by title or content")
    public ResponseEntity<ApiResponse<List<NoteDTO>>> searchNotes(
            HttpServletRequest req,
            @RequestParam String query) {
        User user = getCurrentUser(req);
        List<NoteDTO> notes = noteService.searchNotes(query, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notes search completed", notes));
    }

    @GetMapping("/tags")
    @Operation(summary = "Get notes by tags", description = "Retrieves notes filtered by tags")
    public ResponseEntity<ApiResponse<List<NoteDTO>>> getNotesByTags(
            HttpServletRequest req,
            @RequestParam List<String> tags) {
        User user = getCurrentUser(req);
        List<NoteDTO> notes = noteService.getNotesByTags(tags, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notes retrieved by tags", notes));
    }

    @PatchMapping("/{noteId}/star")
    @Operation(summary = "Toggle star", description = "Toggles the starred status of a note")
    public ResponseEntity<ApiResponse<NoteDTO>> toggleStar(
            HttpServletRequest req,
            @PathVariable String noteId) {
        User user = getCurrentUser(req);
        NoteDTO note = noteService.toggleStar(noteId, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Note star toggled", note));
    }

    @PatchMapping("/{noteId}/archive")
    @Operation(summary = "Toggle archive", description = "Toggles the archived status of a note")
    public ResponseEntity<ApiResponse<NoteDTO>> toggleArchive(
            HttpServletRequest req,
            @PathVariable String noteId) {
        User user = getCurrentUser(req);
        NoteDTO note = noteService.toggleArchive(noteId, user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Note archive toggled", note));
    }

    @GetMapping("/count")
    @Operation(summary = "Get notes count", description = "Returns the count of active notes")
    public ResponseEntity<ApiResponse<Long>> getNotesCount(HttpServletRequest req) {
        User user = getCurrentUser(req);
        long count = noteService.getNotesCount(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notes count retrieved", count));
    }
}
