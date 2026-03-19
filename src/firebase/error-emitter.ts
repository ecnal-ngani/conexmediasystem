import { EventEmitter } from 'events';

export const errorEmitter = new EventEmitter();

// Limit listeners for performance
errorEmitter.setMaxListeners(10);
