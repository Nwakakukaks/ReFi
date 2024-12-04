import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyIcon } from "lucide-react";
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
          expectedAmount: parseUnits("1", selectedCurrency.decimals).toString(), // $1 worth
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
    <div className="flex justify-center items-center mt-10 h-[70vh]">
      <div className="border-2 border-gray-500 flex flex-col justify-center items-center gap-2 rounded-sm px-4 py-12 shadow-lg w-[90%]">
        {isDisconnected && <div className="text-red-500 mb-4">Please connect your wallet</div>}

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

        <div className="flex space-x-4 w-[90%]">
          <select
            name="currency"
            onChange={(e) => setCurrency(e.target.value)}
            defaultValue={currency}
            className="mt-4 p-2 border rounded-sm text-gray-800"
          >
            {Array.from(currencies.entries()).map(([key, value]) => (
              <option key={key} value={key}>
                {value.symbol} ({value.network})
              </option>
            ))}
          </select>

          <select
            name="storage-chain"
            onChange={(e) => setStorageChain(e.target.value)}
            defaultValue={storageChain}
            className="mt-4 p-2 border rounded-sm text-gray-800"
          >
            {Array.from(storageChains.entries()).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name} ({value.type})
              </option>
            ))}
          </select>
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
