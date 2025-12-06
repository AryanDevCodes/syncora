package com.syncora.security.oauth2;

import java.util.Map;

public class GithubOAuth2UserInfo extends OAuth2UserInfo {

    public GithubOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
    }

    @Override
    public String getId() {
        return ((Integer) attributes.get("id")).toString();
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }

    @Override
    public String getFirstName() {
        String name = getName();
        if (name != null && name.contains(" ")) {
            return name.substring(0, name.indexOf(" "));
        }
        return name != null ? name : getEmail().split("@")[0];
    }

    @Override
    public String getLastName() {
        String name = getName();
        if (name != null && name.contains(" ")) {
            return name.substring(name.indexOf(" ") + 1);
        }
        return "";
    }

    @Override
    public String getImageUrl() {
        return (String) attributes.get("avatar_url");
    }

    @Override
    public String getProfileUrl() {
        return (String) attributes.get("html_url");
    }
}
