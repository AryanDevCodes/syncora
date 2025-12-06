package com.syncora.note.repository;

import com.syncora.note.Note;
import com.syncora.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, String> {
    
    List<Note> findByOwnerAndArchivedOrderByCreatedAtDesc(User owner, boolean archived);
    
    List<Note> findByOwnerAndStarredAndArchivedOrderByCreatedAtDesc(User owner, boolean starred, boolean archived);
    
    List<Note> findByOwnerOrderByCreatedAtDesc(User owner);
    
    Optional<Note> findByIdAndOwner(String id, User owner);
    
    @Query("SELECT n FROM Note n WHERE n.owner = :owner AND " +
           "(LOWER(n.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(n.content) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Note> searchNotes(@Param("owner") User owner, @Param("query") String query);
    
    @Query("SELECT n FROM Note n JOIN n.tags t WHERE n.owner = :owner AND t IN :tags")
    List<Note> findByOwnerAndTagsIn(@Param("owner") User owner, @Param("tags") List<String> tags);
    
    long countByOwnerAndArchived(User owner, boolean archived);
}
