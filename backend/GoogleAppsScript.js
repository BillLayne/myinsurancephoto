// ============================================================================
// MYINSURANCEPHOTO.COM - BACKEND SCRIPT (STANDARD)
// ============================================================================

const OPTIONAL_SHEET_ID = ""; // Leave empty if script is bound to the sheet

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(e.postData.contents);
    
    // --- STEP A: SAVE TO DRIVE ---
    // The "clientName" now includes the Ref ID, so the folder will be named uniquely automatically.
    var rootFolderName = (data.clientName || "Client") + " - " + (data.address || "No Address");
    var timestamp = new Date();
    var folderName = rootFolderName + " - " + timestamp.toISOString().slice(0,10);
    
    var folder = DriveApp.createFolder(folderName);
    var fileCount = 0;
    
    if (data.files && data.files.length > 0) {
      data.files.forEach(function(file) {
        var blob = Utilities.newBlob(Utilities.base64Decode(file.data), file.mimeType, file.name);
        folder.createFile(blob);
        fileCount++;
      });
    }

    // --- STEP B: SAVE TO SHEETS ---
    var sheet = getSpreadsheet();
    if (sheet) {
      ensureHeaders(sheet);
      
      // Standard Columns: Timestamp, Client, Policy, Carrier, Address, Phone, Email, Count, Link
      sheet.appendRow([
        timestamp,
        data.clientName, // This now contains "(Ref: 1234)"
        data.policyNumber || "N/A",
        data.insuranceCompany || "N/A",
        data.address,
        data.clientPhone || "",
        data.agentEmail || "",
        fileCount,
        folder.getUrl()
      ]);
    }

    // --- STEP C: EMAIL NOTIFICATION ---
    var emailBody = "New photos uploaded via MyInsurancePhoto.com\n\n";
    emailBody += "Client: " + data.clientName + "\n";
    emailBody += "Address: " + data.address + "\n";
    emailBody += "Carrier: " + (data.insuranceCompany || "N/A") + "\n";
    emailBody += "Photos: " + fileCount + "\n";
    emailBody += "\nView Folder: " + folder.getUrl();
    if (sheet) {
      emailBody += "\nView Sheet: " + sheet.getParent().getUrl();
    }
    
    MailApp.sendEmail({
      to: "Save@BillLayneInsurance.com",
      subject: "Photos Uploaded: " + data.clientName,
      body: emailBody
    });

    return ContentService.createTextOutput(JSON.stringify({ result: "success", id: folder.getId() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSheet();
  } catch (e) {
    if (OPTIONAL_SHEET_ID) {
      return SpreadsheetApp.openById(OPTIONAL_SHEET_ID).getSheets()[0];
    }
  }
  return null;
}

function ensureHeaders(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    var headers = [
      "Timestamp", 
      "Client Name", 
      "Policy Number", 
      "Carrier", 
      "Address", 
      "Client Phone", 
      "Agent Email", 
      "Photo Count", 
      "Drive Folder Link"
    ];
    
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setFontWeight("bold");
    range.setBackground("#fbbf24");
    sheet.setFrozenRows(1);
  }
}