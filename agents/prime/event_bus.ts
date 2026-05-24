import { EventEmitter } from 'events';

export const LucyBus = new EventEmitter();

// Setup basic logging
LucyBus.on('system:boot', () => {
  console.log('[EventBus] System Boot');
});
