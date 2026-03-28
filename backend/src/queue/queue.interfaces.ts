/**
 * Interface for dummy job data
 */
export interface DummyJobData {
  /**
   * Unique identifier for the job
   */
  id: string;

  /**
   * Message to process
   */
  message: string;

  /**
   * Timestamp when job was created
   */
  createdAt: Date;

  /**
   * Optional priority (higher = more important)
   */
  priority?: number;
}

/**
 * Interface for email job data
 */
export interface EmailJobData {
  /**
   * Recipient email address
   */
  to: string;

  /**
   * Email subject
   */
  subject: string;

  /**
   * Email body (plain text)
   */
  body: string;

  /**
   * Optional HTML body
   */
  html?: string;
}

/**
 * Interface for on-chain event job data
 */
export interface OnChainEventJobData {
  /**
   * Transaction hash
   */
  txHash: string;

  /**
   * Event type
   */
  eventType: string;

  /**
   * Event payload
   */
  payload: Record<string, unknown>;

  /**
   * Block height
   */
  blockHeight: number;
}
