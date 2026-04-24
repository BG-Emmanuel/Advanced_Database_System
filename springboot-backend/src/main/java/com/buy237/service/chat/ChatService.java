package com.buy237.service.chat;

import com.buy237.model.chat.ChatMessage;
import com.buy237.repository.chat.ChatMessageRepository;
import com.buy237.dto.chat.ChatMessageRequest;
import com.buy237.dto.chat.ChatMessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {
    @Autowired
    private ChatMessageRepository chatMessageRepository;

    public ChatMessageResponse sendMessage(ChatMessageRequest request) {
        ChatMessage message = ChatMessage.builder()
                .senderId(request.getSenderId())
                .receiverId(request.getReceiverId())
                .content(request.getContent())
                .sentAt(LocalDateTime.now())
                .build();
        message = chatMessageRepository.save(message);
        return toChatMessageResponse(message);
    }

    public List<ChatMessageResponse> getConversation(Long user1, Long user2) {
        List<ChatMessage> messages = chatMessageRepository.findBySenderIdAndReceiverIdOrReceiverIdAndSenderId(user1, user2, user1, user2);
        return messages.stream().map(this::toChatMessageResponse).collect(Collectors.toList());
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage message) {
        ChatMessageResponse resp = new ChatMessageResponse();
        resp.setId(message.getId());
        resp.setSenderId(message.getSenderId());
        resp.setReceiverId(message.getReceiverId());
        resp.setContent(message.getContent());
        resp.setSentAt(message.getSentAt());
        return resp;
    }
}
