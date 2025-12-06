package com.syncora.contact.service;

import com.syncora.contact.dto.ContactCreateRequest;
import com.syncora.contact.dto.ContactDto;
import com.syncora.contact.dto.ContactUpdateRequest;

import java.util.List;


public interface ContactService {

    List<ContactDto> getAllContacts(String userEmail);
    ContactDto createContact(String userEmail, ContactCreateRequest req);
    ContactDto updateContact(String userEmail, String contactId, ContactUpdateRequest req);
    void deleteContact(String userEmail, String contactId);
    ContactDto getById(String userEmail, String contactId);


}
