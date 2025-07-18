<template>
  <div>
    <h1>Chat Room</h1>
    <div v-if="isConnected">
      <div v-for="(msg, index) in messages" :key="index">
        <strong>{{ msg.user }}:</strong> {{ msg.message }}
      </div>
      <input v-model="newMessage" @keyup.enter="handleSendMessage" placeholder="Type a message..." />
      <button @click="handleSendMessage">Send</button>
    </div>
    <div v-else>
      <p>Connecting to chat...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSocket } from '~/composables/useSocket';

const { messages, isConnected, joinRoom, leaveRoom, sendMessage } = useSocket();
const newMessage = ref('');
const room = 'general';
const user = 'testUser'; // Replace with actual user data

onMounted(() => {
  joinRoom(room);
});

function handleSendMessage() {
  if (newMessage.value.trim()) {
    sendMessage(room, user, newMessage.value);
    newMessage.value = '';
  }
}
</script>
