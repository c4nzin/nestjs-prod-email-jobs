export interface SendWelcomeEmailJobData {
  schemaVersion: 1;
  eventId: string;
  userId: string;
  email: string;
  name: string;

  correlationId: string;
  createdAt: string;
}

export interface MailJobResult {
  providerMessageId: string;
  accepted: string[];
  rejected: string[];
  sentAt: string;
}

//do not include password or any sensitive information in the job data eg. payload
//it will be stored in the cache and could be accessed by other services... so dont do that pls
