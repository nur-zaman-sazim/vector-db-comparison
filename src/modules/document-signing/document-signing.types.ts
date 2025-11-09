export type TDocusealSubmitter = {
  name?: string;
  uuid: string;
  email?: string;
  role?: string;
  metadata?: Record<string, number>;
};

export type TDocusealDocument = {
  id?: number;
  uuid?: string;
  url?: string;
  preview_image_url?: string;
  filename?: string;
  name?: string;
  file?: string;
};

export type TDocusealCreateTemplateRequest = {
  name: string;
  folder_name: string;
  documents: TDocusealDocument[];
};

export type TDocusealCreateTemplateResponse = {
  name: string;
  folder_id: number;
  submitters: TDocusealSubmitter[];
  updated_at?: string;
  id: number;
  slug: string;
  external_id?: string;
  folder_name: string;
  documents: TDocusealDocument[];
};

export type TDocusealPreferences = {
  send_email?: boolean;
  send_sms?: boolean;
};

export type TDocusealSubmissionRequest = {
  template_id: number;
  submitters: TDocusealSubmitter[];
  preferences: TDocusealPreferences;
  expire_at: string;
};

export type TDocusealSubmissionData = {
  id: number;
  submission_id: number;
  uuid: string;
  email: string;
  slug: string;
  metadata?: Record<string, number>;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  name: string | null;
  phone: string | null;
  external_id: string | null;
  declined_at: string | null;
  status: string;
  role: string;
  preferences: TDocusealPreferences;
  embed_src: string;
};

export type TDocusealSubmissionResponse = {
  data: TDocusealSubmissionData[];
};

export type TDocusealWebhookPayload = {
  event_type: string;
  timestamp: string;
  data: {
    id: number;
    submission_id: number;
    email: string;
    ua: string;
    ip: string;
    role: string;
    external_id: string;
    application_key?: string;
    sent_at?: string;
    status: string;
    opened_at?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    metadata: Record<string, number>;
    preferences: {
      send_email: boolean;
      send_sms: boolean;
    };
    documents: Array<{
      name: string;
      url: string;
    }>;
    template: {
      id: number;
      name: string;
      external_id: string;
      created_at: string;
      updated_at: string;
      folder_name: string;
    };
    submission: {
      id: number;
      audit_log_url?: string;
      status: string;
      url: string;
      created_at: string;
    };
  };
};
