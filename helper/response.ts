export interface GoodResponse<T = any> {
  success: true;
  message: string;
  statusCode: number;
  data?: T;
  [key: string]: any;
}

export interface FailedResponse {
  success: false;
  message: string;
  statusCode: number;
  errorName?: string;
  [key: string]: any;
}

export const goodResponse = <T = any>(
  response: T = {} as T,
  message: string = 'Success'
): GoodResponse<T> => ({
  ...response,
  success: true,
  message,
  statusCode: 200,
});


export const failedResponse = (
  message: string,
  statusCode: number = 401,
  errorName: string = ''
): FailedResponse => ({
  success: false,
  message,
  statusCode,
  errorName,
});
