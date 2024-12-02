# NearPay 
## Near Network Superchat for YouTube

NearPay integrates Near Network payments with YouTube live streams, allowing viewers to send ETH directly to creators during live streams and see their superchats appear in real time on the live chat.

TLDR: A Youtube superchat alternative, where a user can pay via Near network directly to the content creator via a popup from a URL in the chat.

Simple Setup: The creator generates a unique URL.
Easy Interaction: Users click the URL to open a popup for sending superchats.
Real-Time Display: The bot posts messages to the live chat, visible to everyone.

## Features

- Send ETH directly to creators via Near Network - popup payment window, so no need to leave the stream and miss any of the live content.
- Display superchats in YouTube live chat in real time
- Validates authentic NearPay messages and removes fake ones
- Flexible Payment Amounts: Viewers can choose how much to donate
- Creator dashboard to view superchats and payments coming in in real-time or historical data from previous lives

Live demo: [NearPay](https://nearpay.vercel.app)

***For the best experience please use YouTube in Firefox as sometimes the popup doesn't open in other browsers (like Brave).***

## What it does / how it works

1. Creators generate a unique NearPay link from the creator landing page.
2. The link is connected to their Near address and video ID, they can pin it in their livestream for visibility.
3. Viewers click this link to send ETH directly to the creator's wallet via Near Network.
4. Viewers can include a message that instantly appears as a special superchat in the YouTube live chat.
5. The system validates authentic NearPay messages and removes fake ones.

## Impact

NearPay addresses key challenges in the creator economy:

1. **Reduced Fees**: Enables creators to retain a larger portion of their earnings.
2. **Global Reach**: Allows international viewers to easily support creators.
3. **Blockchain Adoption**: Encourages wider use of blockchain and Near Network in everyday transactions.
4. **Scalability**: The system can be adapted for other streaming platforms and use cases.

## Contribution to Near Ecosystem

NearPay directly contributes to the growth of the Near ecosystem by:

1. Increasing Near Network adoption and usage
2. Demonstrating practical, user-friendly applications of Near network in everyday scenarios
3. Bridging the gap between traditional content platforms and cryptocurrency

## Getting Started

To use NearPay, creators need:

- A YouTube account with live streaming enabled
- A Near Network wallet address
- That's literally it. So easy. So fast. No tech knowledge necessary.

## Usage

### For Creators

1. Visit the creator page
2. Enter your YouTube Live URL and Near address
3. Generate a unique NearPay link
4. Pin the generated link in your YouTube live chat

### For Viewers

1. Click the NearPay link in the live chat
2. Enter your message and the amount of ETH to send
3. Pay the Near invoice
4. Your superchat will appear in the YouTube live chat

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in a `.env` file:
   ```
   YOUTUBE_CLIENT_ID=your_youtube_client_id
   YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
   YOUTUBE_REDIRECT_URI=your_youtube_redirect_uri
   YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token
   ```
4. Start the server: `npm start`

## Technologies Used

- Backend: Node.js with Express
- Frontend: HTML, CSS, and JavaScript
- Near Network Integration
- YouTube API: For live chat integration

## License

[MIT License](LICENSE)



<br />
