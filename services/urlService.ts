import { ClientUploadRequest } from '../types';

/**
 * Encodes the request data into a base64 string safely.
 */
export const encodeRequestData = (data: ClientUploadRequest): string => {
  try {
    const jsonString = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonString));
  } catch (error) {
    console.error("Failed to encode data", error);
    return "";
  }
};

/**
 * Decodes the base64 string back into request data.
 */
export const decodeRequestData = (hash: string): ClientUploadRequest | null => {
  try {
    const decodedString = decodeURIComponent(atob(hash));
    return JSON.parse(decodedString) as ClientUploadRequest;
  } catch (error) {
    console.error("Failed to decode data", error);
    return null;
  }
};
