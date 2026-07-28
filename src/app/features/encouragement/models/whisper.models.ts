export type WhisperStatus = 'draft' | 'generated' | 'consent_sent' | 'accepted' | 'opened' | 'listened' | 'failed';
export type DeliveryFormat = 'text' | 'audio' | 'text_audio';
export type RecipientType = 'internal' | 'external';
export type RecipientGender = 'male' | 'female';
export type DeliveryChannel = 'email' | 'sms' | 'in_app';
export interface MuaContext {
  sourceApplication?: string;
  organizationId?: string;
  contextType?: string;
  contextId?: string;
  learningPackId?: string;
  capsuleId?: string;
  challengeId?: string;
  cohortId?: string;
  recipientMuaUserId?: string;
}
export interface InternalRecipientSummary {
  userId: string;
  displayName: string;
  preferredName?: string;
}
export interface ExternalRecipientInput {
  name: string;
  preferredAddressName: string;
  gender: RecipientGender;
  email?: string;
  phone?: string;
}
export interface WhisperInput extends MuaContext {
  recipientType: RecipientType;
  recipientMuaUserId?: string;
  externalRecipient?: ExternalRecipientInput;
  recipientName: string;
  preferredAddressName: string;
  recipientGender: RecipientGender;
  whisperType: string;
  wrapStyle: string;
  deliveryFormat: DeliveryFormat;
  senderIntent: string;
}
export interface GeneratedContent {
  title: string;
  message: string;
  scriptureReference: string;
  scriptureText: string;
  shortPrayer: string;
}
export interface DeliveryChannelResult {
  channel: DeliveryChannel;
  status: 'succeeded' | 'failed' | 'pending';
  message?: string;
  retrySupported?: boolean;
}
export interface RecipientEventSummary {
  acceptedAt?: string;
  openedAt?: string;
  listenedAt?: string;
}
export interface WhisperRecord extends MuaContext {
  id: string;
  senderId: string;
  recipientDisplayName: string;
  whisperType: string;
  deliveryFormat: DeliveryFormat;
  status: WhisperStatus;
  content?: GeneratedContent;
  confirmedAt?: string;
  audioReady?: boolean;
  audioPlaybackUrl?: string;
  deliveryResults?: DeliveryChannelResult[];
  recipientEvents?: RecipientEventSummary;
  createdAt: string;
  updatedAt: string;
}
export interface WhisperListResponse {
  items: WhisperRecord[];
  total: number;
  nextCursor?: string;
}
export interface WhisperHistoryFilters {
  search?: string;
  status?: WhisperStatus;
  cursor?: string;
  pageSize?: number;
}
export interface AudioUploadRequest {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}
export interface AudioUploadResponse {
  uploadUrl: string;
  uploadId: string;
  expiresAt: string;
  requiredHeaders?: Record<string, string>;
}
export interface AudioUploadCompletionRequest {
  uploadId: string;
  sizeBytes: number;
  mimeType: string;
}
export interface ConsentDeliveryResponse {
  whisperId: string;
  status: WhisperStatus;
  results: DeliveryChannelResult[];
}
export type PublicUnwrapState =
  | 'consent_required'
  | 'accepted'
  | 'opened'
  | 'listened'
  | 'expired'
  | 'revoked'
  | 'not_found';
export interface PublicUnwrapResponse {
  state: PublicUnwrapState;
  recipientDisplayName?: string;
  content?: GeneratedContent;
  audioPlaybackUrl?: string;
}
export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  code?: string;
  traceId?: string;
  correlationId?: string;
  errors?: Record<string, string[]>;
}
export interface WhisperError {
  kind:
    | 'authentication'
    | 'entitlement'
    | 'validation'
    | 'conflict'
    | 'rate_limit'
    | 'provider'
    | 'unavailable'
    | 'unknown';
  message: string;
  status: number;
  traceId?: string;
  fieldErrors?: Record<string, string[]>;
}
