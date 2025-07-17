import { OpenrouterRequestBody } from '@/lib/openrouter';
import { EditorPromptVariable } from './prompt-editor';

export type SdkExchangeResponseSuccess = {
  jwt: string;
  expiresAt: number;
};

export type SdkExchangeResponseError = {
  error: string;
};

export type SdkExchangeResponse = SdkExchangeResponseSuccess | SdkExchangeResponseError;

export type ExecutePromptResponseStream = {
  stream: ReadableStream<Uint8Array<ArrayBufferLike>> | null;
  logUuid: string;
};

export type ExecutePromptResponseNonStream = {
  completion: OpenrouterRequestBody;
  logUuid: string;
};

export type ExecutePromptResponseError = {
  error: string;
  missingGlobalContext?: string[];
  missingRequiredVariables?: EditorPromptVariable[];
};

export type ExecutePromptResponse =
  | ExecutePromptResponseStream
  | ExecutePromptResponseNonStream
  | ExecutePromptResponseError;
