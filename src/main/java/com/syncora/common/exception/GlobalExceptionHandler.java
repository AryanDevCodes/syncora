package com.syncora.common.exception;

import com.syncora.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<String>> handleApi(ApiException exception){
        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false,exception.getMessage(),null));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<String>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404)
                .body(new ApiResponse<>(false, ex.getMessage(), null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleOther(Exception ex) {
        ex.printStackTrace();
        return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "Unexpected error: " + ex.getMessage(), null));
    }
}
