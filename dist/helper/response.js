export const goodResponse = (response = {}, message = 'Success') => ({
    ...response,
    success: true,
    message,
    statusCode: 200,
});
export const failedResponse = (message, statusCode = 401, errorName = '') => ({
    success: false,
    message,
    statusCode,
    errorName,
});
//# sourceMappingURL=response.js.map