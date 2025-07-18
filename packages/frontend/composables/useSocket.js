import { io } from "socket.io-client";
import { ref, onMounted, onUnmounted } from "vue";

export function useSocket() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const socket = io(process.env.NUXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
    auth: { token }
  });
  const messages = ref([]);
  const isConnected = ref(false);

  socket.on("connect", () => {
    isConnected.value = true;
  });

  socket.on("disconnect", () => {
    isConnected.value = false;
  });

  socket.on("connect_error", (err) => {
    messages.value.push({ user: "System", message: err.message });
  });

  socket.on("chatMessage", (data) => {
    messages.value.push(data);
  });

  function joinRoom(room) {
    socket.emit("joinRoom", room);
  }

  function leaveRoom(room) {
    socket.emit("leaveRoom", room);
  }

  function sendMessage(room, user, message) {
    socket.emit("chatMessage", { room, user, message });
  }

  onMounted(() => {
    onUnmounted(() => {
      socket.disconnect();
    });
  });

  return {
    messages,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
  };
}
