import { ClientUploadRequest, UploadedFile } from '../types';

// --- CONFIGURATION ---
// Tiiny.host (and other static hosts) CANNOT handle file uploads or emails on their own.
// You MUST deploy the Google Script to act as your "Backend".
//
// 1. Open 'backend/GoogleAppsScript.js' in this project.
// 2. Copy the code into a new project at https://script.google.com/
// 3. Deploy as Web App (Execute as: Me, Access: Anyone).
// 4. Paste the resulting "Web App URL" below:
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAJmeadV3E9VnYT1Bgbe1Tby20TJG4qVrJsCMkCoAJq7DMMgv6oF21U6gXZAeHvk_A/exec"; 

/**
 * Resizes an image to a maximum dimension (e.g. 1280px) to ensure fast uploads
 * and prevent hitting Google Apps Script payload limits.
 */
export const compressImage = async (file: File, quality: number = 0.7): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280; // Good balance for underwriting quality vs file size
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const uploadPhotosToDrive = async (
  requestData: ClientUploadRequest,
  files: UploadedFile[],
  confirmationId: string // Received from ClientUpload
): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (GOOGLE_SCRIPT_URL.includes("INSERT_YOUR")) {
    console.error("Google Script URL not configured.");
    return { success: false, error: "Backend not connected. Tiiny.host cannot process files without the Google Script. Please contact the agency." };
  }

  try {
    // Dynamic Quality: If sending many photos (>10), compress slightly more (0.6) to avoid timeout.
    // If few photos, keep high quality (0.7).
    const compressionQuality = files.length > 10 ? 0.6 : 0.7;

    // 1. Compress all images
    const processedFiles = await Promise.all(
      files.map(async (f) => {
        const { base64, mimeType } = await compressImage(f.file, compressionQuality);
        return {
          name: `${f.requirementId}_${f.file.name}`,
          mimeType: mimeType,
          data: base64,
          label: f.requirementId
        };
      })
    );

    // 2. Prepare Payload
    // STRATEGY: Combine Client Name + Confirmation ID so we don't need a special column in the backend.
    const combinedName = `${requestData.clientName} (Ref: ${confirmationId})`;

    const payload = {
      clientName: combinedName, 
      policyNumber: requestData.policyNumber,
      insuranceCompany: requestData.insuranceCompany,
      address: requestData.address,
      agentEmail: requestData.agentEmail || "Save@BillLayneInsurance.com",
      files: processedFiles
    };

    // 3. Send to Google Apps Script
    // CRITICAL: Content-Type must be 'text/plain' to avoid CORS preflight (OPTIONS) check issues
    // on localhost and some browsers. Google Apps Script parses the body regardless.
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.result === "success") {
        return { success: true, id: result.id };
    } else {
        return { success: false, error: result.error };
    }

  } catch (error: any) {
    console.error("Upload failed", error);
    return { success: false, error: error.message || "Network Error" };
  }
};