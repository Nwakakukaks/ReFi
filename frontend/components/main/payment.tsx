import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { useAccount, useNetwork, useWalletClient } from "wagmi";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { payRequest, hasSufficientFunds, hasErc20Approval, approveErc20 } from "@requestnetwork/payment-processor";
import { Web3SignatureProvider } from "@requestnetwork/web3-signature";
import { useEthersV5Signer } from "@/hooks/use-ethers-signer";
import { useEthersV5Provider } from "@/hooks/use-ethers-provider";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";

const Payment: React.FC = () => {
  const { chain } = useNetwork();
  const provider = useEthersV5Provider();
  const signer = useEthersV5Signer();
  const [storageChain] = useState(() => {
    const chains = Array.from(storageChains.keys());
    return chains.length > 0 ? chains[0] : "";
  });

  // Wallet connection
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [currency] = useState(() => {
    const currencyKeys = Array.from(currencies.keys());
    return currencyKeys.length > 0 ? currencyKeys[0] : "";
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Request Network specific states
  const [requestData, setRequestData] = useState<Types.IRequestDataWithEvents>();
  const [requestId] = useState(new URLSearchParams(window.location.search).get("requestId") || "");
  const [recipientAddress] = useState(new URLSearchParams(window.location.search).get("lnaddr") || "");
  const [videoId] = useState(new URLSearchParams(window.location.search).get("vid") || "");

  const payTheRequest = async () => {
    console.log("Starting payTheRequest function");

    if (!requestId) {
      console.error("No request ID found");
      toast({
        title: "Error",
        description: "No request found to pay",
      });
      return;
    }

    const selectedCurrency = currencies.get(currency);
    const selectedStorageChain = storageChains.get(storageChain);

    if (!selectedCurrency || !selectedStorageChain) {
      console.error("Invalid currency or storage chain configuration", {
        currency,
        storageChain,
      });
      toast({
        title: "Configuration Error",
        description: "Invalid currency or storage chain configuration",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      console.log("Setting up signature provider and request client");

      const signatureProvider = new Web3SignatureProvider(walletClient);
      const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
          baseURL: selectedStorageChain.gateway,
        },
        signatureProvider,
      });

      console.log("Fetching request data for requestId:", requestId);
      const request = await requestClient.fromRequestId(requestId);
      const requestData = request.getData();

      console.log("Request data retrieved:", {
        network: requestData.currencyInfo.network,
        expectedAmount: requestData.expectedAmount,
        currency: requestData.currency,
      });

      if (!requestData.expectedAmount || requestData.expectedAmount === "0") {
        console.error("Invalid amount for payment");
        toast({
          title: "Payment Error",
          description: "Invalid payment amount",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (requestData.currencyInfo.network !== chain?.network) {
        console.error("Network mismatch", {
          requestNetwork: requestData.currencyInfo.network,
          currentNetwork: chain?.network,
        });
        toast({
          title: "Network Mismatch",
          description: `Please switch to ${requestData.currencyInfo.network}`,
        });
        setLoading(false);
        return;
      }

      console.log("Checking for sufficient funds");
      const hasFunds = await hasSufficientFunds({
        request: requestData,
        address: address as string,
        providerOptions: {
          provider: provider,
        },
      });

      if (!hasFunds) {
        console.error("Insufficient funds for the request");
        toast({
          title: "Insufficient Funds",
          description: "You do not have enough funds to pay this request",
        });
        setLoading(false);
        return;
      }

      console.log("Checking ERC20 approval");
      const _hasErc20Approval = await hasErc20Approval(requestData, address as string, provider);
      if (!_hasErc20Approval) {
        console.log("Requesting ERC20 approval");
        const approvalTx = await approveErc20(requestData, signer);
        await approvalTx.wait(2);
        console.log("ERC20 approval transaction completed");
      }

      console.log("Paying the request");
      const paymentTx = await payRequest(requestData, signer);
      await paymentTx.wait(2);

      if (paymentTx.hash) {
        console.log(`Payment successful, transaction hash: ${paymentTx.hash}`);
      }

      const ethereumAmount = Number(requestData.expectedAmount) / Math.pow(10, 18);

      console.log(`Preparing API call to confirm payment with params`, {
        message,
        amount: ethereumAmount,
        videoId,
        address: recipientAddress,
        hash: paymentTx.hash,
      });

      const backendResponse = await fetch("https://aptopus-backend.vercel.app/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          amount: ethereumAmount,
          videoId,
          address: recipientAddress,
          hash: paymentTx.hash,
        }),
      });

      console.log("API call made, waiting for response");
      const data = await backendResponse.json();

      if (data.success) {
        console.log("Backend payment confirmation successful");
        toast({
          title: "Success",
          description: `Payment sent successfully! Transaction hash: ${paymentTx.hash}`,
        });

        setSuccessMessage(`Your Superchat has been posted ⚡⚡ successfully`);
      } else {
        console.error("Backend payment confirmation failed", data);
        toast({
          title: "Error",
          description: "Payment processing failed. Please try again.",
          variant: "destructive",
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Comprehensive payment error:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing the payment",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadRequestData = async () => {
      if (requestId) {
        try {
          const requestClient = new RequestNetwork({
            nodeConnectionConfig: {
              baseURL: storageChains.get(storageChain)!.gateway,
            },
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

    loadRequestData();
  }, [requestId]);

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
                Request Amount: {Number(requestData.expectedAmount) / Math.pow(10, 18)} {requestData.currency}
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
