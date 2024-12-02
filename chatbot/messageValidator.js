const fs = require("fs");
const path = require("path");

const validMessagesFile = path.join(__dirname, "validMessages.json");

// Load valid messages from file on startup
let validMessages = new Set();
if (fs.existsSync(validMessagesFile)) {
  const validMessagesArray = JSON.parse(fs.readFileSync(validMessagesFile, "utf8"));
  validMessages = new Set(validMessagesArray);
}

function addValidMessage(message) {
  validMessages.add(message);
  // Save the updated valid messages to file
  fs.writeFileSync(validMessagesFile, JSON.stringify(Array.from(validMessages)), "utf8");

  // Remove the message after 10 minutes
  setTimeout(
    () => {
      validMessages.delete(message);
      // Save the updated valid messages to file
      fs.writeFileSync(validMessagesFile, JSON.stringify(Array.from(validMessages)), "utf8");
    },
    10 * 60 * 1000,
  );
}

function isValidMessage(message) {
  return validMessages.has(message);
}

// function isSuperchatFormat(message) {
//     const regex = /^⚡+ 𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧 \[\d+ APTO\]: .+/;
//     return regex.test(message);
// }

const existingMessages = new Set(); // Set to track existing messages

function isSuperchatFormat(message) {
  // The exact bold 𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧 text in Unicode
  const exactBoldText = "𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧";
  const exactLightningBolts = "⚡⚡";

  // Validate the exact format character by character
  const regex = new RegExp(`^${exactLightningBolts}\\s${exactBoldText}\\s\\[(\\d+(?:\\.\\d+)?)\\sAPTO\\]:\\s.+$`);

  // Basic format check
  if (!regex.test(message)) {
    return false;
  }

  // Check for duplicate messages
  if (existingMessages.has(message)) {
    return false; // Message is a duplicate
  } else {
    existingMessages.add(message); // Add new message to the set
  }

  // Additional security checks
  const parts = message.split(": ");
  if (parts.length !== 2) return false;

  const [header, content] = parts;

  // Check the header structure
  const headerParts = header.split(" [");
  if (headerParts.length !== 2) return false;

  // The first part should be "⚡⚡ 𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧"
  const [prefixPart, amountPart] = headerParts;
  const [lightningEmojis, superChat] = prefixPart.split(" ");

  // Verify exact lightning emoji pattern
  if (lightningEmojis !== exactLightningBolts) return false;

  // Verify exact 𝗦𝗨𝗣𝗘𝗥𝗖𝗛𝗔𝗧 text
  if (superChat !== exactBoldText) return false;

  // Verify amount format
  if (!amountPart.endsWith(" APTO]")) return false;

  // Extract and validate amount
  const amount = amountPart.slice(0, -6); // Remove ' APTO]'
  if (!/^\d+(?:\.\d+)?$/.test(amount)) return false;

  // Verify the amount is a valid number
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) return false;

  // Message content should not be empty
  if (content.trim().length === 0) return false;

  // Ensure the message is not in lowercase
  if (/[a-z]/.test(content)) return false; // Check for lowercase in the content

  // Additional checks for common spoofing attempts
  const lightningCount = [...message].filter((char) => char === "⚡").length;
  if (lightningCount !== 2) return false;

  // Check for multiple occurrences of SUPERCHAT/APTO
  if ((message.match(/superchat/gi) || []).length > 1) return false;
  if ((message.match(/apto/gi) || []).length > 1) return false;

  // Success - message passed all validation checks
  return true;
}


module.exports = { addValidMessage, isValidMessage, isSuperchatFormat };
