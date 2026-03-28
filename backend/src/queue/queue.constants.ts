/**
 * Queue names used across the application
 */
export const QUEUE_NAMES = {
  /**
   * Queue for email-related tasks
   */
  EMAIL: 'email',

  /**
   * Queue for on-chain event processing
   */
  ON_CHAIN_EVENTS: 'on-chain-events',

  /**
   * Dummy queue for testing/proof of concept
   */
  DUMMY: 'dummy',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
