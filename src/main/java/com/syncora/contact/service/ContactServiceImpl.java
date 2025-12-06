package com.syncora.contact.service;

import com.syncora.common.exception.ApiException;
import com.syncora.contact.Contact;
import com.syncora.contact.dto.ContactCreateRequest;
import com.syncora.contact.dto.ContactDto;
import com.syncora.contact.dto.ContactUpdateRequest;
import com.syncora.contact.repository.ContactRepository;
import com.syncora.user.entity.User;
import com.syncora.user.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactServiceImpl implements ContactService {
    private final ContactRepository contactRepo;
    private final UserRepository userRepo;

    @Override
    public List<ContactDto> getAllContacts(String userEmail) {
        User owner = findUser(userEmail);
        return contactRepo.findByOwner(owner)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public ContactDto createContact(String userEmail, ContactCreateRequest req) {
        User owner = findUser(userEmail);
        if (contactRepo.existsByEmailAndOwner(req.getEmail(), owner)) {
            throw new ApiException("A contact with this email already exists for this user");

        }
        Contact contact = Contact.builder()
                .owner(owner)
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .organization(req.getOrganization())
                .position(req.getPosition())
                .address(req.getAddress())
                .website(req.getWebsite())
                .secondaryPhone(req.getSecondaryPhone())
                .linkedinUrl(req.getLinkedinUrl())
                .twitterHandle(req.getTwitterHandle())
                .tags(req.getTags())
                .department(req.getDepartment())
                .managerName(req.getManagerName())
                .employeeId(req.getEmployeeId())
                .startDate(req.getStartDate())
                .industry(req.getIndustry())
                .birthday(req.getBirthday())
                .anniversary(req.getAnniversary())
                .nickname(req.getNickname())
                .avatarUrl(req.getAvatarUrl())
                .note(req.getNote())
                .createdAt(LocalDateTime.now())
                .build();
        Objects.requireNonNull(contact);
        contactRepo.save(contact);
        return mapToDto(contact);
    }

    @Override
    @Transactional
    public ContactDto updateContact(String userEmail, String contactId, ContactUpdateRequest req) {
        User owner = findUser(userEmail);

        Contact contact = contactRepo.findByIdAndOwnerId(contactId, owner.getId())
                .orElseThrow(() -> new ApiException("Contact does not exist"));

        if (req.getName() != null) {
            contact.setName(req.getName());
        }
        if (req.getEmail() != null) {
            contact.setEmail(req.getEmail());
        }
        if (req.getPhone() != null) {
            contact.setPhone(req.getPhone());
        }
        if (req.getOrganization() != null) {
            contact.setOrganization(req.getOrganization());
        }
        if (req.getPosition() != null) {
            contact.setPosition(req.getPosition());
        }
        if (req.getAddress() != null) {
            contact.setAddress(req.getAddress());
        }
        if (req.getWebsite() != null) {
            contact.setWebsite(req.getWebsite());
        }
        if (req.getSecondaryPhone() != null) {
            contact.setSecondaryPhone(req.getSecondaryPhone());
        }
        if (req.getLinkedinUrl() != null) {
            contact.setLinkedinUrl(req.getLinkedinUrl());
        }
        if (req.getTwitterHandle() != null) {
            contact.setTwitterHandle(req.getTwitterHandle());
        }
        if (req.getTags() != null) {
            contact.setTags(req.getTags());
        }
        if (req.getDepartment() != null) {
            contact.setDepartment(req.getDepartment());
        }
        if (req.getManagerName() != null) {
            contact.setManagerName(req.getManagerName());
        }
        if (req.getEmployeeId() != null) {
            contact.setEmployeeId(req.getEmployeeId());
        }
        if (req.getStartDate() != null) {
            contact.setStartDate(req.getStartDate());
        }
        if (req.getIndustry() != null) {
            contact.setIndustry(req.getIndustry());
        }
        if (req.getBirthday() != null) {
            contact.setBirthday(req.getBirthday());
        }
        if (req.getAnniversary() != null) {
            contact.setAnniversary(req.getAnniversary());
        }
        if (req.getNickname() != null) {
            contact.setNickname(req.getNickname());
        }
        if (req.getAvatarUrl() != null) {
            contact.setAvatarUrl(req.getAvatarUrl());
        }
        if (req.getNote() != null) {
            contact.setNote(req.getNote());
        }
        contact.setUpdatedAt(LocalDateTime.now());
        if (contact.getCreatedAt() == null) contact.setCreatedAt(LocalDateTime.now());

        contactRepo.save(contact);
        return mapToDto(contact);
    }

    @Override
    public void deleteContact(String userEmail, String contactId) {
        User owner = findUser(userEmail);

        Contact contact = contactRepo.findByIdAndOwnerId(contactId, owner.getId())
                .orElseThrow(
                        () -> new ApiException("Contact does not exist")
                );
        Objects.requireNonNull(contact);
        contactRepo.delete(contact);
    }

    @Override
    public ContactDto getById(String userEmail, String contactId) {
        User owner = findUser(userEmail);

        Contact contact = contactRepo.findByIdAndOwnerId(contactId, owner.getId())
                .orElseThrow(
                        () -> new ApiException("Contact does not exist")
                );

        return mapToDto(contact);
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() ->
                        new ApiException("User Not Found"));

    }

    private ContactDto mapToDto(Contact c) {
        ContactDto dto = new ContactDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setEmail(c.getEmail());
        dto.setPhone(c.getPhone());
        dto.setOrganization(c.getOrganization());
        dto.setPosition(c.getPosition());
        dto.setAddress(c.getAddress());
        dto.setWebsite(c.getWebsite());
        dto.setSecondaryPhone(c.getSecondaryPhone());
        dto.setLinkedinUrl(c.getLinkedinUrl());
        dto.setTwitterHandle(c.getTwitterHandle());
        dto.setTags(c.getTags());
        dto.setDepartment(c.getDepartment());
        dto.setManagerName(c.getManagerName());
        dto.setEmployeeId(c.getEmployeeId());
        dto.setStartDate(c.getStartDate());
        dto.setIndustry(c.getIndustry());
        dto.setBirthday(c.getBirthday());
        dto.setAnniversary(c.getAnniversary());
        dto.setNickname(c.getNickname());
        dto.setAvatarUrl(c.getAvatarUrl());
        dto.setNote(c.getNote());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }



}
