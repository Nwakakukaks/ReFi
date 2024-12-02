const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const youtube = google.youtube("v3");
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI,
);

oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});

async function postToYouTubeChat(message, liveChatId) {
  console.log("Attempting to post message to YouTube chat:", message);
  console.log("Live Chat ID:", liveChatId);
  try {
    const response = youtube.liveChatMessages.insert({
      auth: oauth2Client,
      part: "snippet",
      resource: {
        snippet: {
          type: "textMessageEvent",
          liveChatId: liveChatId,
          textMessageDetails: {
            messageText: message,
          },
        },
      },
    });
    console.log("Message posted successfully:", message);
    return response.data;
  } catch (error) {
    console.error("Error posting message to YouTube chat:", error.message);
    console.error("Error details:", error.response ? error.response.data : "No response data");
    throw error;
  }
}

async function getLiveChatId(videoId) {
  try {
    const response = await youtube.videos.list({
      auth: oauth2Client,
      part: "liveStreamingDetails",
      id: videoId,
    });

    if (!response || !response.data || !response.data.items || response.data.items.length === 0) {
      throw new Error("No video found with this ID");
    }

    const video = response.data.items[0];

    // Check if video has liveStreamingDetails
    if (!video.liveStreamingDetails || !video.liveStreamingDetails.activeLiveChatId) {
      throw new Error("This video is not a live stream or has no active chat");
    }

    return video.liveStreamingDetails.activeLiveChatId;
  } catch (error) {
    console.error("Error in getLiveChatId:", error);
    throw error;
  }
}

async function deleteMessage(messageId, liveChatId) {
  try {
    youtube.liveChatMessages.delete({
      auth: oauth2Client,
      id: messageId,
      liveChatId: liveChatId,
    });
    console.log("Message deleted successfully:", messageId);
  } catch (error) {
    console.error("Error deleting message:", error);
  }
}

module.exports = {
  youtube,
  oauth2Client,
  postToYouTubeChat,
  getLiveChatId,
  deleteMessage,
};
