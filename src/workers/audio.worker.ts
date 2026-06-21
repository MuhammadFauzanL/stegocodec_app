/// <reference lib="webworker" />

self.addEventListener('message', (event) => {
  console.log('[Audio Worker] Received message', event.data);
});
