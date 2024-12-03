import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyIcon } from "lucide-react";
import { 
  useAccount, 
  useWalletClient, 
} from 'wagmi';
import { parseUnits, zeroAddress } from 'viem';
import { 
  RequestNetwork, 
  Types, 
  Utils 
} from '@requestnetwork/request-client.js';
import { Web3SignatureProvider } from '@requestnetwork/web3-signature';

const CreatorLinkGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState("");
  const [Address, setAddress] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [requestId, setRequestId] = useState("");

  // Wallet connection
  const { address, isDisconnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const handleStreams = () => {
    navigate("/streams");
  };

  const handleTransactions = () => {
    navigate("/transactions");
  };

  const copyLink = () => {
    navigator.clipboard
      .writeText(generatedUrl)
      .then(() => {
        toast({
          variant: "default",
          title: "Link copied",
          description: "Creator link copied successfully!",
        });
      })
      .catch((error) => {
        console.error("Error copying the link: ", error);
      });
  };

  const createRequestNetwork = async () => {
    if (!walletClient || !address) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        variant: 'destructive'
      });
      return null;
    }

    const signatureProvider = new Web3SignatureProvider(walletClient);
    const requestClient = new RequestNetwork({
      nodeConnectionConfig: {
        baseURL: 'https://ipfs.request.network',
      },
      signatureProvider,
    });

    try {
      const requestCreateParameters: Types.ICreateRequestParameters = {
        requestInfo: {
          currency: {
            type: Types.RequestLogic.CURRENCY.ERC20,
            value: 'ETH',
            network: 'sepolia',
          },
          expectedAmount: parseUnits('5', 18).toString(), // $5 worth of ETH
          payee: {
            type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
            value: address,
          },
          timestamp: Utils.getCurrentTimestampInSecond(),
        },
        paymentNetwork: {
          id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
          parameters: {
            paymentNetworkName: 'sepolia',
            paymentAddress: address,
            feeAddress: zeroAddress,
            feeAmount: '0',
          },
        },
        contentData: {
          videoId: extractVideoId(videoUrl),
          creatorAddress: Address,
        },
        signer: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: address,
        },
      };

      const request = await requestClient.createRequest(requestCreateParameters);
      const confirmedRequestData = await request.waitForConfirmation();

      return confirmedRequestData.requestId;
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to create payment request',
        variant: 'destructive'
      });
      return null;
    }
  };

  const generateSuperchatUrl = async () => {
    const videoId = extractVideoId(videoUrl);
    if (videoId && Address) {
      try {
        // First create Request Network request
        const requestId = await createRequestNetwork();
        
        if (!requestId) return;

        const response = await fetch("https://aptopus-backend.vercel.app/generate-short-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            videoId, 
            address: Address,
            requestId // Pass request ID along with other parameters
          }),
        });
        const data = await response.json();

        if (data.error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error,
          });
        } else {
          const superchatUrl = `${window.location.origin}/s/${data.shortCode}`;
          setGeneratedUrl(superchatUrl);
          setRequestId(requestId);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `An error occurred: ${error}`,
        });
      }
    } else {
      toast({
        variant: "default",
        title: "Enter your Live URL and Address",
        description: "Please enter your live url and address to proceed",
      });
    }
  };

  const extractVideoId = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;

      if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        if (parsedUrl.pathname.startsWith("/live/")) {
          return parsedUrl.pathname.split("/")[2];
        } else if (parsedUrl.searchParams.has("v")) {
          return parsedUrl.searchParams.get("v");
        } else if (hostname === "youtu.be") {
          return parsedUrl.pathname.slice(1);
        }
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
    }
    return null;
  };

  return (
    <div className="flex justify-center items-center mt-10 h-[70vh]">
      <div className="border-2 border-gray-500 flex flex-col justify-center items-center gap-2 rounded-sm px-4 py-12 shadow-lg w-[90%]">
        {isDisconnected && (
          <div className="text-red-500 mb-4">
            Please connect your wallet
          </div>
        )}

        <h1 className="text-2xl text-[#CC0000] font-semibold">Generate Your Unique Link</h1>
        <p className="font-normal text-sm">Generate a unique URL and pin it in your live chat</p>

        <div className="flex space-x-4 w-[90%]">
          <Input
            type="text"
            placeholder="Enter your YouTube Live URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="mt-4 p-2 border rounded-sm text-gray-800"
          />
          <Input
            type="text"
            placeholder="Enter your wallet address"
            value={Address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-4 p-2 border rounded-sm text-gray-800"
          />
        </div>

        <Button
          className="submit-button mt-4 bg-[#CC0000] text-white p-2 rounded hover:bg-[#CC0000] w-[90%]"
          onClick={generateSuperchatUrl}
          disabled={isDisconnected}
        >
          Generate Creator Link
        </Button>
        {generatedUrl && (
          <div className="flex space-x-3 items-center justify-center mt-4 p-4 bg-white rounded-sm shadow text-gray-900 w-[90%]">
            <p className="text-sm text-center">
              Your generated URL:{" "}
              <a href={generatedUrl} target="_blank" rel="noopener noreferrer" className="text-[#CC0000] underline">
                {generatedUrl}
              </a>
            </p>

            <button onClick={copyLink}>
              <CopyIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {requestId && (
          <div className="mt-4 text-sm text-gray-600">
            Request ID: {requestId}
          </div>
        )}

        <div className="grid grid-cols-2 gap-5 mt-8 w-[90%]">
          <Card
            onClick={handleStreams}
            className="bg-transparent text-gray-400 border-gray-600 border-2 rounded-sm mt-2 w-full cursor-pointer "
          >
            <CardContent className="flex items-center justify-center space-x-3 mt-3">
              <div className="flex items-center">
                <img src="/icons/wallet.svg" className="h-14 w-14 p-2 rounded-sm mx-auto" alt="Wallet icon" />
              </div>
              <p className="text-gray-100 text-lg font-medium"> Past streams</p>
            </CardContent>
          </Card>

          <Card
            onClick={handleTransactions}
            className="bg-transparent text-gray-400 border-gray-600 border-2 rounded-sm mt-2 w-full cursor-pointer"
          >
            <CardContent className="flex space-x-3 items-center justify-center mt-3">
              <div className="flex items-center">
                <img src="/icons/member.svg" className="h-14 w-14 p-2 rounded-sm mx-auto" alt="Member icon" />
              </div>
              <p className="text-gray-100 text-lg font-medium"> Transactions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatorLinkGenerator;