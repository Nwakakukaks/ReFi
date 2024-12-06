# ReFi 
## Cross-Chain Superchat for YouTube

ReFi integrates Request Network payments with YouTube live streams, allowing creators to receive superchats in their preferred tokens and chains directly during live streams.

TLDR: A YouTube superchat alternative where users can pay creators via a flexible, multi-chain payment solution integrated directly into the live stream.

Simple Setup: The creator generates a unique payment link.
Easy Interaction: Users click the URL to open a popup for sending superchats.
Real-Time Display: The bot posts messages to the live chat, visible to everyone.

## Features

- Multi-Chain Support: Creators can specify their preferred token and blockchain
- Flexible Payment Options: Viewers can choose cryptocurrency and amount
- Display superchats in YouTube live chat in real time
- Validates authentic ReFi messages and removes fake ones
- Creator dashboard to view superchats and payments in real-time or historical data

Live demo: [ReFi](https://reFi.vercel.app)

***Recommended: Use YouTube in Firefox for the best popup experience.***

## What it does / how it works

1. Creators generate a unique ReFi link from the creator landing page.
2. The link is connected to their wallet address, preferred token, and selected blockchain.
3. Creators can pin the link in their livestream for visibility.
4. Viewers click this link to send cryptocurrency directly to the creator's wallet via Request Network.
5. Viewers can include a message that instantly appears as a special superchat in the YouTube live chat.
6. The system validates authentic ReFi messages and removes fake ones.

## Impact

ReFi addresses key challenges in the creator economy:

1. **Reduced Fees**: Enables creators to receive payments with minimal transaction costs
2. **Global Reach**: Allows international viewers to easily support creators across different blockchains
3. **Flexibility**: Creators can choose their preferred tokens and chains
4. **Blockchain Adoption**: Encourages wider use of cryptocurrency in everyday transactions
5. **Scalability**: The system can be adapted for other streaming platforms and use cases

## Contribution to Web3 Ecosystem

ReFi directly contributes to the growth of the Web3 ecosystem by:

1. Increasing cross-chain payment adoption
2. Demonstrating practical, user-friendly applications of blockchain technology
3. Bridging the gap between traditional content platforms and cryptocurrency
4. Providing creators with more financial sovereignty

## Getting Started

To use ReFi, creators need:

- A YouTube account with live streaming enabled
- A cryptocurrency wallet compatible with Request Network
- Preference for a specific token and blockchain
- No advanced technical knowledge required

## Usage

### For Creators

1. Visit the creator page
2. Enter your YouTube Live URL and wallet address
3. Select preferred token and blockchain
4. Generate a unique ReFi link
5. Pin the generated link in your YouTube live chat

### For Viewers

1. Click the ReFi link in the live chat
2. Enter your message and the amount to send
3. Complete the Request Network payment
4. Your superchat will appear in the YouTube live chat

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in a `.env` file:
   ```
   YOUTUBE_CLIENT_ID=your_youtube_client_id
   YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
   REQUEST_NETWORK_API_KEY=your_request_network_api_key
   ```
4. Start the server: `npm start`

## Technologies Used

- Backend: Node.js with Express
- Frontend: HTML, CSS, and JavaScript
- Request Network Integration
- YouTube API: For live chat integration
- Multi-Chain Support

## License

[MIT License](LICENSE)

## Future Roadmap

- Support for more blockchain networks
- Enhanced creator analytics
- Improved payment routing options
- Expanded platform integrations

## Support

For questions or support, please open an issue on our GitHub repository or contact our support team.