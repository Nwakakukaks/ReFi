import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clapperboard, CopyIcon, Wallet2 } from "lucide-react";
import { useAccount, useWalletClient } from "wagmi";
import { parseUnits, zeroAddress } from "viem";
import { RequestNetwork, Types, Utils } from "@requestnetwork/request-client.js";
import { Web3SignatureProvider } from "@requestnetwork/web3-signature";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";

const CreatorLinkGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState("");
  const [Address, setAddress] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [amount, setAmount] = useState("");
  const [storageChain, setStorageChain] = useState(() => {
    const chains = Array.from(storageChains.keys());
    return chains.length > 0 ? chains[0] : "";
  });

  const [currency, setCurrency] = useState(() => {
    const currencyKeys = Array.from(currencies.keys());
    return currencyKeys.length > 0 ? currencyKeys[0] : "";
  });

  // Wallet connection
  const { address, isDisconnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Validation checks
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleStreams = () => {
    navigate("/streams");
  };

  const handleTransactions = () => {
    navigate("/transactions");
  };

  const copyLink = () => {
    if (!generatedUrl) {
      toast({
        variant: "destructive",
        title: "No Link to Copy",
        description: "Please generate a link first.",
      });
      return;
    }

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
        toast({
          variant: "destructive",
          title: "Copy Failed",
          description: "Unable to copy the link.",
        });
      });
  };

  // Enhanced validation
  const validateInputs = () => {
    const errors: string[] = [];

    // Validate video URL
    if (!videoUrl) {
      errors.push("YouTube Live URL is required");
    } else {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        errors.push("Invalid YouTube URL. Please provide a valid live stream or video URL.");
      }
    }

    // Validate address
    if (!Address || !isValidEthereumAddress(Address)) {
      errors.push("Invalid Ethereum address");
    }

    // Validate currency and storage chain
    if (!currency || !currencies.has(currency)) {
      errors.push("Invalid currency selected");
    }

    if (!storageChain || !storageChains.has(storageChain)) {
      errors.push("Invalid storage chain selected");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Ethereum address validation
  const isValidEthereumAddress = (address: string): boolean => {
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(address);
  };

  const createRequestNetwork = async () => {
    // Validate inputs before proceeding
    if (!validateInputs()) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return null;
    }

    if (!walletClient || !address) {
      toast({
        title: "Wallet Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return null;
    }

    // Verify currency and storage chain are valid
    const selectedCurrency = currencies.get(currency);
    const selectedStorageChain = storageChains.get(storageChain);

    if (!selectedCurrency || !selectedStorageChain) {
      toast({
        title: "Configuration Error",
        description: "Invalid currency or storage chain configuration",
        variant: "destructive",
      });
      return null;
    }

    try {
      const signatureProvider = new Web3SignatureProvider(walletClient);
      const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
          baseURL: selectedStorageChain.gateway,
        },
        signatureProvider,
      });

      const requestCreateParameters: Types.ICreateRequestParameters = {
        requestInfo: {
          currency: {
            type: selectedCurrency.type,
            value: selectedCurrency.value,
            network: selectedCurrency.network,
          },
          expectedAmount: parseUnits(amount, selectedCurrency.decimals).toString(), // $1 worth
          payee: {
            type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
            value: address,
          },
          timestamp: Utils.getCurrentTimestampInSecond(),
        },
        paymentNetwork: {
          id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
          parameters: {
            paymentNetworkName: selectedCurrency.network,
            paymentAddress: address,
            feeAddress: zeroAddress,
            feeAmount: "0",
          },
        },
        contentData: {
          videoId: extractVideoId(videoUrl),
          creatorAddress: Address,
        },
        signer: {
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: address as string,
        },
      };

      const request = await requestClient.createRequest(requestCreateParameters);
      const confirmedRequestData = await request.waitForConfirmation();

      return confirmedRequestData.requestId;
    } catch (err) {
      console.error("Error in createRequestNetwork:", err);

      // More detailed error handling
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while creating the request";

      toast({
        title: "Request Creation Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const generateSuperchatUrl = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      const requestId = await createRequestNetwork();

      if (!requestId) {
        console.log("No requestId returned. Exiting...");
        return;
      }

      console.log(`Request Network request created with requestId: ${requestId}`);

      const videoId = extractVideoId(videoUrl);

      console.log("Making API call to generate short URL...");
      const response = await fetch("https://aptopus-backend.vercel.app/generate-short-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          address: Address,
          requestId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate short URL");
      }

      const superchatUrl = `${window.location.origin}/s/${data.shortCode}`;
      setGeneratedUrl(superchatUrl);

      toast({
        variant: "default",
        title: "Link Generated",
        description: "Your creator link has been successfully generated!",
      });
    } catch (error) {
      console.error("An error occurred:", error);

      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
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

      console.warn("Unable to extract video ID from URL:", url);
    } catch (error) {
      console.error("Error parsing URL:", error);
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 bg-gray-900">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-[#CC0000] mb-3">Get Your Link</h1>
            <p className="text-gray-300 text-sm">Generate a unique SuperChat URL for your stream</p>
          </div>

          {isDisconnected && (
            <div className="bg-red-500/20 text-red-300 text-center p-3 rounded-lg mb-4">
              Please connect your wallet to proceed!
            </div>
          )}

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="YouTube Live URL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="bg-[#2d3e50] border-none text-white placeholder-gray-400"
              />
              <Input
                type="text"
                placeholder="Wallet Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-[#2d3e50] border-none text-white placeholder-gray-400"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="SuperChat Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-[#2d3e50] border-none text-white placeholder-gray-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-[#2d3e50] text-white rounded-md p-2"
                >
                  {Array.from(currencies.entries()).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.symbol} ({value.network})
                    </option>
                  ))}
                </select>
                <select
                  value={storageChain}
                  onChange={(e) => setStorageChain(e.target.value)}
                  className="bg-[#2d3e50] text-white rounded-md p-2"
                >
                  {Array.from(storageChains.entries()).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button 
              onClick={generateSuperchatUrl}
              disabled={isDisconnected}
              className={`w-full ${
                isDisconnected 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-[#CC0000] hover:bg-[#d33f3f] text-white'
              } transition-colors`}
            >
              Generate Creator Link
            </Button>

            {generatedUrl && (
              <div className="flex items-center bg-[#16213e] p-3 rounded-lg mt-4">
                <a 
                  href={generatedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#CC0000] mr-2 truncate flex-grow"
                >
                  {generatedUrl}
                </a>
                <button onClick={copyLink} className="ml-2">
                  <CopyIcon className="text-white w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6 bg-[#e0e1e6]">
          <Card 
            onClick={handleStreams}
            className="bg-gray-700 border-none hover:bg-gray-900 transition-colors cursor-pointer"
          >
            <CardContent className="flex items-center justify-center space-x-2 p-4">
              <Clapperboard className="text-[#CC0000] w-6 h-6" />
              <span className="text-white">Past Streams</span>
            </CardContent>
          </Card>
          <Card 
            onClick={handleTransactions}
            className="bg-gray-700 border-none hover:bg-gray-900 transition-colors cursor-pointer"
          >
            <CardContent className="flex items-center justify-center space-x-2 p-4">
              <Wallet2 className="text-[#CC0000] w-6 h-6" />
              <span className="text-white">Transactions</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatorLinkGenerator;
