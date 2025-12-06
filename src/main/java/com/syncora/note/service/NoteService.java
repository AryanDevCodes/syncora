package com.syncora.note.service;

import com.syncora.note.dto.CreateNoteRequest;
import com.syncora.note.dto.NoteDTO;
import com.syncora.note.dto.UpdateNoteRequest;
import com.syncora.user.entity.User;

import java.util.List;

public interface NoteService {
    
    NoteDTO createNote(CreateNoteRequest request, User owner);
    
    NoteDTO updateNote(String noteId, UpdateNoteRequest request, User owner);
    
    void deleteNote(String noteId, User owner);
    
    NoteDTO getNoteById(String noteId, User owner);
    
    List<NoteDTO> getAllNotes(User owner);
    
    List<NoteDTO> getActiveNotes(User owner);
    
    List<NoteDTO> getStarredNotes(User owner);
    
    List<NoteDTO> getArchivedNotes(User owner);
    
    List<NoteDTO> searchNotes(String query, User owner);
    
    List<NoteDTO> getNotesByTags(List<String> tags, User owner);
    
    NoteDTO toggleStar(String noteId, User owner);
    
    NoteDTO toggleArchive(String noteId, User owner);
    
    long getNotesCount(User owner);
}
