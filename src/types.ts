export type Language = "ru" | "kk";

export type MessageRole = "system" | "user" | "assistant";

export interface Message {
  role: MessageRole;
  content: any;
}

export interface Session {
  fio: string;
  lang: Language;
  messages: Message[];
}

export interface InitRequest {
  sessionId: string;
  type: "init";
  fio: string;
  lang?: Language;
}

export interface MessageRequest {
  sessionId: string;
  type: "message";
  message?: string;
  imageUrl?: string;
}

export interface FinalizeRequest {
  sessionId: string;
  satisfaction: "yes" | "no";
}

export interface MessageResponse {
  reply: string;
}

export interface HandoffResponse {
  intent: "handoff_to_operator";
  reason: string;
}

export interface ReferralResponse {
  intent: "make_referral" | "no_referral_needed";
  fio?: string;
  preliminary_assessment?: string;
  doctor_type?: DoctorType;
  reason?: string; // For "no_referral_needed" - explain why referral is not needed
}

export type DoctorType = 
  | "терапевт"
  | "ЛОР"
  | "дерматолог"
  | "офтальмолог"
  | "невролог"
  | "кардиолог"
  | "хирург"
  | "травматолог"
  | "эндокринолог"
  | "гинеколог"
  | "уролог"
  | "гастроэнтеролог"
  | "педиатр";

