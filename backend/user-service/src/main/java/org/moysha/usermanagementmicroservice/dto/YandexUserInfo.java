package org.moysha.usermanagementmicroservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class YandexUserInfo {

    @JsonProperty("id")
    @NotNull
    private Integer id;

    @JsonProperty("first_name")
    @NotBlank
    private String firstName;

    @JsonProperty("last_name")
    @NotBlank
    private String lastName;


    @JsonProperty("default_email")
    @NotBlank
    private String defaultEmail;

    @JsonProperty("emails")
    private List<String> emails;


    @JsonProperty("default_phone")
    private DefaultPhone defaultPhone;


    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DefaultPhone {

        @JsonProperty("number")
        private String number;
    }
}
