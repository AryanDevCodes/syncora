package com.syncora.task.repository;

import com.syncora.task.Task;
import com.syncora.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, String> {
    
    List<Task> findByOwnerOrderByCreatedAtDesc(User owner);
    
    List<Task> findByOwnerOrAssigneeOrderByCreatedAtDesc(User owner, User assignee);
    
    Optional<Task> findByIdAndOwner(String id, User owner);
    
    List<Task> findByOwnerAndStatusOrderByCreatedAtDesc(User owner, Task.Status status);
    
    List<Task> findByOwnerAndPriorityOrderByCreatedAtDesc(User owner, Task.Priority priority);
    
    List<Task> findByAssigneeOrderByCreatedAtDesc(User assignee);
    
    @Query("SELECT t FROM Task t WHERE (t.owner = :user OR t.assignee = :user) AND " +
           "(LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Task> searchTasks(@Param("user") User user, @Param("query") String query);
    
    @Query("SELECT t FROM Task t JOIN t.tags tag WHERE (t.owner = :user OR t.assignee = :user) AND tag IN :tags")
    List<Task> findByUserAndTagsIn(@Param("user") User user, @Param("tags") List<String> tags);
    
    long countByOwnerAndStatus(User owner, Task.Status status);
    
    long countByOwner(User owner);
}
