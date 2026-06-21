/// <reference lib="webworker" />

self.addEventListener('message', (event) => {
  console.log('[Image Worker] Received message', event.data);
  // Placeholder for future heavy processing
});
