const dotenv = require("dotenv");
dotenv.config();

const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI,
);

// Generate the URL to request access
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // 'offline' means we want a refresh token
  scope: ["https://www.googleapis.com/auth/youtube.force-ssl"], // Adjust scopes as needed
});

// Redirect the user to this URL to get authorization
console.log("Authorize this app by visiting this URL:", authUrl);

// Function to get the refresh token
const getRefreshToken = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Save tokens.refresh_token for future use
  console.log("Refresh Token:", tokens.refresh_token);
};

// After obtaining the authorization code, call this function
// Example: Replace 'your_authorization_code' with the actual code received
getRefreshToken('4/0AVG7fiTA7Go5a0Emwu9eQ_9eLNjLm8qleJbQfHWv5-7IyvCSrJ90HefXVfhKDXoppZGdYg');
