/**
 * Type declarations for react-hot-toast mock
 * This file provides type definitions for the mocked react-hot-toast module in tests
 */
declare module 'react-hot-toast' {
  export const toast: {
    success: jest.Mock;
    error: jest.Mock;
    loading: jest.Mock;
    info?: jest.Mock;
    dismiss?: jest.Mock;
    promise?: jest.Mock;
  };
}
