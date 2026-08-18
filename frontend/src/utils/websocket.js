/**
 * WebSocket manager for live session updates.
 */

export function createLobbySocket(pin, onMessage, onStatusChange) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${protocol}://${window.location.host}/ws/live-sessions/${pin}/lobby/`;
  let socket = null;
  let shouldReconnect = true;
  let reconnectTimer = null;

  function connect() {
    try {
      socket = new WebSocket(url);
      if (onStatusChange) onStatusChange('connecting');

      socket.onopen = () => {
        if (onStatusChange) onStatusChange('connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (e) {
          console.error('WS JSON parse error', e);
        }
      };

      socket.onclose = (e) => {
        if (onStatusChange) onStatusChange('disconnected');
        if (shouldReconnect) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    } catch (err) {
      console.error('WS connection error', err);
      if (shouldReconnect) {
        reconnectTimer = setTimeout(connect, 2000);
      }
    }
  }

  connect();

  return {
    close() {
      shouldReconnect = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    },
  };
}
