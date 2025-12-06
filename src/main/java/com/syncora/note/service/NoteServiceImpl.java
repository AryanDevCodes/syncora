package com.syncora.note.service;

import com.syncora.common.exception.ResourceNotFoundException;
import com.syncora.note.Note;
import com.syncora.note.dto.CreateNoteRequest;
import com.syncora.note.dto.NoteDTO;
import com.syncora.note.dto.UpdateNoteRequest;
import com.syncora.note.repository.NoteRepository;
import com.syncora.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NoteServiceImpl implements NoteService {

    private final NoteRepository noteRepository;

    @Override
    public NoteDTO createNote(CreateNoteRequest request, User owner) {
        log.info("Creating note for user: {}", owner.getEmail());
        
        Note note = Note.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .tags(request.getTags())
                .color(request.getColor())
                .starred(request.isStarred())
                .archived(request.isArchived())
                .owner(owner)
                .build();

        Note savedNote = noteRepository.save(note);
        log.info("Note created successfully with ID: {}", savedNote.getId());
        
        return mapToDTO(savedNote);
    }

    @Override
    public NoteDTO updateNote(String noteId, UpdateNoteRequest request, User owner) {
        log.info("Updating note {} for user: {}", noteId, owner.getEmail());
        
        Note note = noteRepository.findByIdAndOwner(noteId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        if (request.getTitle() != null) {
            note.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            note.setContent(request.getContent());
        }
        if (request.getTags() != null) {
            note.setTags(request.getTags());
        }
        if (request.getColor() != null) {
            note.setColor(request.getColor());
        }
        if (request.getStarred() != null) {
            note.setStarred(request.getStarred());
        }
        if (request.getArchived() != null) {
            note.setArchived(request.getArchived());
        }

        Note updatedNote = noteRepository.save(note);
        log.info("Note updated successfully: {}", noteId);
        
        return mapToDTO(updatedNote);
    }

    @Override
    public void deleteNote(String noteId, User owner) {
        log.info("Deleting note {} for user: {}", noteId, owner.getEmail());
        
        Note note = noteRepository.findByIdAndOwner(noteId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        noteRepository.delete(note);
        log.info("Note deleted successfully: {}", noteId);
    }

    @Override
    @Transactional(readOnly = true)
    public NoteDTO getNoteById(String noteId, User owner) {
        log.info("Fetching note {} for user: {}", noteId, owner.getEmail());
        
        Note note = noteRepository.findByIdAndOwner(noteId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        return mapToDTO(note);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteDTO> getAllNotes(User owner) {
        log.info("Fetching all notes for user: {}", owner.getEmail());
        
        List<Note> notes = noteRepository.findByOwnerOrderByCreatedAtDesc(owner);
        return notes.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteDTO> getActiveNotes(User owner) {
        log.info("Fetching active notes for user: {}", owner.getEmail());
        
        List<Note> notes = noteRepository.findByOwnerAndArchivedOrderByCreatedAtDesc(owner, false);
        return notes.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteDTO> getStarredNotes(User owner) {
        log.info("Fetching starred notes for user: {}", owner.getEmail());
        
        List<Note> notes = noteRepository.findByOwnerAndStarredAndArchivedOrderByCreatedAtDesc(owner, true, false);
        return notes.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteDTO> getArchivedNotes(User owner) {
        log.info("Fetching archived notes for user: {}", owner.getEmail());
        
        List<Note> notes = noteRepository.findByOwnerAndArchivedOrderByCreatedAtDesc(owner, true);
        return notes.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteDTO> searchNotes(String query, User owner) {
        log.info("Searching notes with query '{}' for user: {}", query, owner.getEmail());
        
        List<Note> notes = noteRepository.searchNotes(owner, query);
        return notes.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoteDTO> getNotesByTags(List<String> tags, User owner) {
        log.info("Fetching notes with tags {} for user: {}", tags, owner.getEmail());
        
        List<Note> notes = noteRepository.findByOwnerAndTagsIn(owner, tags);
        return notes.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public NoteDTO toggleStar(String noteId, User owner) {
        log.info("Toggling star for note {} for user: {}", noteId, owner.getEmail());
        
        Note note = noteRepository.findByIdAndOwner(noteId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        note.setStarred(!note.isStarred());
        Note updatedNote = noteRepository.save(note);
        log.info("Note star toggled: {} - starred: {}", noteId, updatedNote.isStarred());
        
        return mapToDTO(updatedNote);
    }

    @Override
    public NoteDTO toggleArchive(String noteId, User owner) {
        log.info("Toggling archive for note {} for user: {}", noteId, owner.getEmail());
        
        Note note = noteRepository.findByIdAndOwner(noteId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        note.setArchived(!note.isArchived());
        Note updatedNote = noteRepository.save(note);
        log.info("Note archive toggled: {} - archived: {}", noteId, updatedNote.isArchived());
        
        return mapToDTO(updatedNote);
    }

    @Override
    @Transactional(readOnly = true)
    public long getNotesCount(User owner) {
        return noteRepository.countByOwnerAndArchived(owner, false);
    }

    private NoteDTO mapToDTO(Note note) {
        return NoteDTO.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .tags(note.getTags())
                .color(note.getColor())
                .starred(note.isStarred())
                .archived(note.isArchived())
                .ownerId(note.getOwner().getId())
                .ownerEmail(note.getOwner().getEmail())
                .ownerName(note.getOwner().getFirstName() + " " + note.getOwner().getLastName())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
