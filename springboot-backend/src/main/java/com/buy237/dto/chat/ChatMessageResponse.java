package com.buy237.dto.chat;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatMessageResponse {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String content;
    private LocalDateTime sentAt;
}
