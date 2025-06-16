export type SdkExchangeResponseSuccess = {
  jwt: string;
  expiresAt: number;
};

export type SdkExchangeResponseError = {
  error: string;
};

export type SdkExchangeResponse = SdkExchangeResponseSuccess | SdkExchangeResponseError;
