import { ClientUploadRequest } from '../types';

export const generateEmailTemplate = (data: ClientUploadRequest, link: string) => {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0;">
  <div style="max-w-idth: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px; text-align: center;">
      <h1 style="color: #fbbf24; margin: 0; font-size: 24px; font-weight: 800;">Bill Layne Insurance</h1>
      <p style="color: #c7d2fe; margin: 5px 0 0; font-size: 14px;">Elkin's Trusted Agency</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p>Hello <strong>${data.clientName}</strong>,</p>
      
      <p>To finalize your quote or policy underwriting for <strong>${data.insuranceCompany ? data.insuranceCompany : 'your policy'}</strong> at <strong>${data.address || 'your property'}</strong>, we need a few photos.</p>
      
      <p>Please click the button below to securely upload the required images directly from your smartphone. No app download is required.</p>

      <!-- Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${link}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
          Upload Photos Now
        </a>
      </div>

      <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <p style="margin: 0 0 10px; font-weight: bold; font-size: 14px; color: #64748b;">REQUESTED ITEMS:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569;">
          ${data.requirements.map(req => `<li style="margin-bottom: 4px;">${req.label}</li>`).join('')}
        </ul>
      </div>

      <p style="font-size: 14px; color: #64748b;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="${link}" style="color: #4f46e5;">${link}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">Bill Layne Insurance</p>
      <p style="margin: 5px 0 0;">Secure Document Portal</p>
    </div>
  </div>
</body>
</html>
  `;
};