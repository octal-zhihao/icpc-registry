export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type EmailSentStatus = 'pending' | 'sent' | 'failed';

export interface Registration {
  id: string;
  name: string;
  student_id: string;
  major: string;
  college: string;
  enrollment_year: number;
  email: string;
  qq: string;
  resume: string;
  status: RegistrationStatus;
  review_note?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  email_sent_status: EmailSentStatus;
  email_sent_at?: string;
}

export interface Attachment {
  id: string;
  registration_id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  template_type: 'approved' | 'rejected';
  subject: string;
  content: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  registration_id: string;
  template_type: string;
  recipient_email: string;
  sent_success: boolean;
  error_message?: string;
  sent_at: string;
}
