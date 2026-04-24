package com.buy237.controller.chat;

import com.buy237.dto.chat.ChatMessageRequest;
import com.buy237.dto.chat.ChatMessageResponse;
import com.buy237.service.chat.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ChatService chatService;

    @PostMapping("/send")
    public ResponseEntity<ChatMessageResponse> sendMessage(@RequestBody ChatMessageRequest request) {
        ChatMessageResponse response = chatService.sendMessage(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversation")
    public ResponseEntity<List<ChatMessageResponse>> getConversation(@RequestParam Long user1, @RequestParam Long user2) {
        List<ChatMessageResponse> messages = chatService.getConversation(user1, user2);
        return ResponseEntity.ok(messages);
    }
}
