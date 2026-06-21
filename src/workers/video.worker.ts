/// <reference lib="webworker" />

self.addEventListener('message', (event) => {
  console.log('[Video Worker] Received message', event.data);
});
