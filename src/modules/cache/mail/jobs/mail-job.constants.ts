export const MAIL_QUEUE = 'mail-queue';

export const MAIL_JOB_NAMES = {
  SEND_WELCOME_EMAIL: 'send-welcome-email',
} as const;

//life saver
export type MailJobName = (typeof MAIL_JOB_NAMES)[keyof typeof MAIL_JOB_NAMES];
