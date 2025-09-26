function doPost(e) {
  try {
    var action = e.parameter.action;
    if (!action) throw new Error("Missing action parameter");

    switch (action) {
      case "addEmployee":
        return addEmployee(e);
      case "login":
        return login(e);
      case "Check-In":
      case "Check-Out":
        return handleAttendance(e);
      case "getOffices":
        return getOffices();
      case "getOfficeLocation":
        return getOfficeLocation(e);
      case "getAgentsByOffice":
        return getAgentsByOffice(e);
      case "getAllEmployees":
        return getAllEmployees();
      default:
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Unknown action: " + action }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Server error: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* Utility: hash password */
function hashPassword(password) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return rawHash.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

/* Add Employee */
function addEmployee(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Employees");
    if (!sheet) throw new Error("Employees sheet not found");

    var office = e.parameter.office;
    var name = e.parameter.name;
    var phone = e.parameter.phone;
    var role = e.parameter.role;
    var password = e.parameter.password;
    var latitude = e.parameter.latitude;
    var longitude = e.parameter.longitude;
    var accuracy = e.parameter.accuracy;

    if (!office || !name || !phone || !role || !password || !latitude || !longitude) {
      throw new Error("Missing required fields");
    }

    var hashedPass = hashPassword(password);
    sheet.appendRow([new Date(), office, name, phone, role, hashedPass, latitude, longitude, accuracy]);

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Employee added successfully" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Add employee failed: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* Login */
function login(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Employees");
    if (!sheet) throw new Error("Employees sheet not found");

    var phone = e.parameter.phone;
    var password = e.parameter.password;
    var hashedInput = hashPassword(password);

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][3] == phone && data[i][5] == hashedInput) {
        var role = data[i][4];
        var token = Utilities.getUuid();
        sheet.getRange(i + 1, 10).setValue(token); // store token in column J
        return ContentService.createTextOutput(JSON.stringify({ success: true, role: role, token: token }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Invalid phone or password" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Login failed: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* Attendance Handler */
function handleAttendance(e) {
  try {
    var action = e.parameter.action;
    var phone = e.parameter.phone;
    var latitude = parseFloat(e.parameter.latitude);
    var longitude = parseFloat(e.parameter.longitude);
    var shift = e.parameter.shift;

    if (!phone || !latitude || !longitude || !shift) {
      throw new Error("Missing required attendance fields");
    }

    // Example simplified attendance logic
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Attendance");
    if (!sheet) throw new Error("Attendance sheet not found");

    sheet.appendRow([new Date(), phone, action, latitude, longitude, shift]);

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: action + " successful" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Attendance error: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* Placeholder functions for other actions */
function getOffices() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Offices");
    if (!sheet) throw new Error("Offices sheet not found");

    var data = sheet.getDataRange().getValues();
    var offices = [];
    for (var i = 1; i < data.length; i++) {
      offices.push({ id: data[i][0], name: data[i][1] });
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, offices: offices }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Get offices failed: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOfficeLocation(e) {
  try {
    var officeId = e.parameter.officeId;
    if (!officeId) throw new Error("Missing officeId");

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Offices");
    if (!sheet) throw new Error("Offices sheet not found");

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == officeId) {
        return ContentService.createTextOutput(JSON.stringify({ success: true, lat: data[i][2], lng: data[i][3] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Office not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Get office location failed: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAgentsByOffice(e) {
  try {
    var officeId = e.parameter.officeId;
    if (!officeId) throw new Error("Missing officeId");

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Employees");
    if (!sheet) throw new Error("Employees sheet not found");

    var data = sheet.getDataRange().getValues();
    var agents = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] == officeId && data[i][4] == "agent") {
        agents.push({ name: data[i][2], phone: data[i][3] });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, agents: agents }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Get agents failed: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllEmployees() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Employees");
    if (!sheet) throw new Error("Employees sheet not found");

    var data = sheet.getDataRange().getValues();
    var employees = [];
    for (var i = 1; i < data.length; i++) {
      employees.push({ office: data[i][1], name: data[i][2], phone: data[i][3], role: data[i][4] });
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, employees: employees }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Get all employees failed: " + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
