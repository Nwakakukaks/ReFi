import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { useAccount, useNetwork } from "wagmi";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { payRequest, hasSufficientFunds, hasErc20Approval, approveErc20 } from "@requestnetwork/payment-processor";
import { Web3SignatureProvider } from "@requestnetwork/web3-signature";
import { useEthersV5Signer } from "@/hooks/use-ethers-signer";
import { useEthersV5Provider } from "@/hooks/use-ethers-provider";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";

const Payment: React.FC = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const provider = useEthersV5Provider();
  const signer = useEthersV5Signer();
  const [storageChain, setStorageChain] = useState(() => {
    const chains = Array.from(storageChains.keys());
    return chains.length > 0 ? chains[0] : "";
  });

  const [currency, setCurrency] = useState(() => {
    const currencyKeys = Array.from(currencies.keys());
    return currencyKeys.length > 0 ? currencyKeys[0] : "";
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");

  // Request Network specific states
  const [requestData, setRequestData] = useState<Types.IRequestDataWithEvents>();
  const [requestId] = useState(new URLSearchParams(window.location.search).get("requestId") || "");
  const [recipientAddress] = useState(new URLSearchParams(window.location.search).get("lnaddr") || "");
  const [videoId] = useState(new URLSearchParams(window.location.search).get("vid") || "");

  const payTheRequest = async () => {
    if (!requestId) {
      toast({
        title: "Error",
        description: "No request found to pay",
      });
      return;
    }

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
      setLoading(true);

      // Initialize Request Network client
      const signatureProvider = new Web3SignatureProvider(signer);
      const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
          baseURL: storageChains.get(storageChain)!.gateway,
        },
        signatureProvider,
      });

      // Fetch the request
      const request = await requestClient.fromRequestId(requestId);
      const requestData = request.getData();

      // Check if the request is on the correct network
      if (requestData.currencyInfo.network !== chain?.network) {
        toast({
          title: "Network Mismatch",
          description: `Please switch to ${requestData.currencyInfo.network}`,
        });
        setLoading(false);
        return;
      }

      // Check for sufficient funds
      const hasFunds = await hasSufficientFunds({
        request: requestData,
        address: address as string,
        providerOptions: {
          provider: provider,
        },
      });

      if (!hasFunds) {
        toast({
          title: "Insufficient Funds",
          description: "You do not have enough funds to pay this request",
        });
        setLoading(false);
        return;
      }

      const _hasErc20Approval = await hasErc20Approval(requestData, address as string, provider);
      if (!_hasErc20Approval) {
        const approvalTx = await approveErc20(requestData, signer);
        await approvalTx.wait(2);
      }

      // Pay the request
      const paymentTx = await payRequest(requestData, signer);
      await paymentTx.wait(2);

      // Backend simulation (similar to previous implementation)
      const backendResponse = await fetch("https://aptopus-backend.vercel.app/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          amount: requestData.expectedAmount,
          videoId,
          address: recipientAddress,
          hash: paymentTx.hash,
        }),
      });

      const data = await backendResponse.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Payment sent successfully! Transaction hash: ${paymentTx.hash}`,
        });

        // Generate claim URL (reusing existing logic)
        // await generateClaimUrl();

        setSuccessMessage(`Your Superchat has been posted ⚡⚡ successfully`);
      } else {
        toast({
          title: "Error",
          description: "Payment processing failed. Please try again.",
          variant: "destructive",
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing the payment",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const generateClaimUrl = async () => {
    if (videoId && recipientAddress) {
      try {
        const response = await fetch("https://aptopus-backend.vercel.app/generate-short-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId, address: recipientAddress }),
        });
        const data = await response.json();

        if (data.error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error,
          });
        } else {
          const claimUrl = `${window.location.origin}/c/${data.shortCode}`;
          setGeneratedUrl(claimUrl);
        }
      } catch (error) {
        console.error("Error generating claim URL:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `An error occurred: ${error}`,
        });
      }
    }
  };

  // Load request data on component mount
  useEffect(() => {
    const loadRequestData = async () => {
      if (requestId) {
        try {
          const signatureProvider = new Web3SignatureProvider(signer);
          const requestClient = new RequestNetwork({
            nodeConnectionConfig: {
              baseURL: storageChains.get(storageChain)!.gateway,
            },
            signatureProvider,
          });

          const request = await requestClient.fromRequestId(requestId);
          setRequestData(request.getData());
        } catch (error) {
          console.error("Error loading request data:", error);
          toast({
            title: "Error",
            description: "Could not load request details",
            variant: "destructive",
          });
        }
      }
    };

    if (signer) {
      loadRequestData();
    }
  }, [requestId, signer]);

  return (
    <div className="flex flex-col gap-3 justify-center items-center mx-auto h-[75vh]">
      {!address ? (
        <div className=""></div>
      ) : (
        <div className={`bg-white rounded-lg shadow-md px-6 py-12 w-[85%]`}>
          <h1 className="text-2xl text-[#5DEB5A]">ReFi </h1>
          <Input
            name="message"
            placeholder="Enter your Superchat message"
            type="text"
            maxLength={220}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded p-2 mt-2 mb-4 text-gray-800"
          />
          {requestData && (
            <div className="mb-4 text-gray-700">
              <p>
                Request Amount: {Number(requestData.expectedAmount) / Math.pow(10, 18)}{" "}
                {requestData.currency}
              </p>
            </div>
          )}
          <Button
            id="send-superchat-button"
            onClick={payTheRequest}
            disabled={loading || !requestId}
            className={`w-full bg-gradient-to-br from-[#CC0000] to-[#880606] text-white rounded p-2 transition-all duration-300 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Sending..." : "Send Superchat"}
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="bg-white text-gray-900 rounded-md p-2 mt-1 w-[90%]">
          <h2 className="text-base font-semibold">Payment Successful!</h2>
          <p className="text-sm">{successMessage}</p>
          {/* <p className="text-xs mt-2">
            Hurray! claim your token here:{" "}
            <a href={generatedUrl} className="text-[#5DEB5A]">
              {generatedUrl}
            </a>
          </p> */}
        </div>
      )}
    </div>
  );
};

export default Payment;
