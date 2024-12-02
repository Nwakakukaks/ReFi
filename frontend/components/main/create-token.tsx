import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "react-router-dom";
import { toast } from "../ui/use-toast";
import { parseUnits } from "ethers";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Contract_Address, abi } from "@/constants";
import { Upload } from "lucide-react";

const CONTRACT_ADDRESS = Contract_Address;
const ABI = abi;

const DynamicMint = () => {
  const location = useLocation();
  const [videoId] = useState(new URLSearchParams(window.location.search).get("vid") || "");
  const [creatorAddress] = useState(new URLSearchParams(window.location.search).get("lnaddr") || "");
  const { address } = useAccount();

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    max_supply: "",
    uri: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [image, setImage] = useState<File | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contract interactions
  const { writeContract: writeCreateNFT, data: createNFTData } = useWriteContract();
  const { writeContract: writeClaimNFT, data: claimNFTData } = useWriteContract();

  const { isLoading: isCreateNFTLoading, isSuccess: isCreateNFTSuccess } = useWaitForTransactionReceipt({
    hash: createNFTData,
  });

  const { isLoading: isClaimNFTLoading, isSuccess: isClaimNFTSuccess } = useWaitForTransactionReceipt({
    hash: claimNFTData,
  });

  // Read contract data
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "totalSupply",
  });

  const { data: ownsAnyUTK, refetch: refetchOwnsAnyUTK } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "ownsAnyUTK",
    args: [address],
  });

  useEffect(() => {
    if (location.pathname !== "/dashbord") {
      refetchTotalSupply();
      refetchOwnsAnyUTK();
    }
  }, [location.pathname, address]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onCreateNFT = async () => {
    try {
      if (!address) {
        toast({
          title: "No wallet connected",
          description: "Please connect a wallet to proceed",
        });
        return;
      }

      if (!image) {
        toast({
          title: "No image selected",
          description: "Please upload an image to proceed",
        });
        return;
      }

      setLoading(true);
      console.log("Starting NFT creation process...");

      // Create FormData for image upload
      const formDataToUpload = new FormData();
      formDataToUpload.append("file", image);
      formDataToUpload.append("upload_preset", "baserl");

      console.log("Uploading image to Cloudinary...");
      const uploadResponse = await fetch("https://api.cloudinary.com/v1_1/dgaw6tnra/image/upload", {
        method: "POST",
        body: formDataToUpload,
      });

      const uploadData = await uploadResponse.json();
      if (uploadData.secure_url) {
        console.log("Image uploaded successfully:", uploadData.secure_url);
        const newImageUrl = uploadData.secure_url;
        setFormData((prev) => ({ ...prev, uri: newImageUrl }));

        console.log("Calling CreateNFT function...");
        writeCreateNFT({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: "CreateNFT",
          args: [parseUnits(formData.max_supply, 0), newImageUrl],
        });
      } else {
        throw new Error("Failed to upload image.");
      }
    } catch (error) {
      console.error("Error in NFT creation:", error);
      toast({
        title: "Error",
        description: "Failed to create NFT. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onClaimNFT = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      return toast({
        title: "Error",
        description: "Please connect your wallet",
      });
    }

    try {
      setLoading(true);
      console.log("Starting NFT claim process...");
      await writeClaimNFT({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "claimNFT",
        args: [creatorAddress],
      });
    } catch (error) {
      console.error("Error in NFT claim:", error);
      toast({
        title: "Error",
        description: "Failed to claim NFT. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAccessUrl = async () => {
    if (videoId && creatorAddress) {
      try {
        console.log("Generating access URL...");
        const response = await fetch("https://aptopus-backend.vercel.app/generate-short-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId, address: creatorAddress }),
        });
        const data = await response.json();

        if (data.error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error,
          });
        } else {
          const accessUrl = `${window.location.origin}/a/${data.shortCode}`;
          setGeneratedUrl(accessUrl);
          console.log("Access URL generated:", accessUrl);
        }
      } catch (error) {
        console.error("Error generating access URL:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `An error occurred: ${error}`,
        });
      }
    } else {
      toast({
        variant: "default",
        title: "Access Link Error",
        description: "Failed to generate Access Link",
      });
    }
  };

  useEffect(() => {
    if (isCreateNFTSuccess) {
      setSuccess(true);
      console.log("NFT created successfully. Transaction hash:", createNFTData);
      toast({
        title: "Success",
        description: `NFT created successfully! Transaction hash: ${createNFTData}`,
      });
    }
  }, [isCreateNFTSuccess, createNFTData]);

  useEffect(() => {
    if (isClaimNFTSuccess) {
      setSuccess(true);
      console.log("NFT claimed successfully. Transaction hash:", claimNFTData);
      toast({
        title: "Success",
        description: `NFT claimed successfully! Transaction hash: ${claimNFTData}`,
      });
      generateAccessUrl();
      refetchTotalSupply();
      refetchOwnsAnyUTK();
    }
  }, [isClaimNFTSuccess, claimNFTData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setPreviewImage(reader.result);
          setFormData((prev) => ({ ...prev, icon_uri: file.name }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="rounded-none w-full shadow-md mx-auto border-2 border-gray-600 h-full overflow-y-auto p-4 mb-6">
      {location.pathname === "/dashboard" ? (
        <div className="p-4">
          {/* NFT Creation Form */}
          <div className=" flex flex-col items-center justify-center rounded-sm mt-1">
            <img
              src={previewImage ? previewImage : "/icons/upload.svg"}
              alt={`icon`}
              className=" max-w-24 h-auto max-h-40 object-contain mb-4 rounded-full overflow-hidden"
            />

            <div className="mt-1">
              <div className="flex items-center space-x-2 my-1">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center bg-transparent text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Icon
                </Button>
                <Input
                  id="icon_upload"
                  name="icon_upload"
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 text-start">
            <div>
              <Label className="text-gray-100" htmlFor="name">
                Token Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter token name"
                className="text-gray-200 bg-transparent rounded-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-100" htmlFor="symbol">
                Token Symbol
              </Label>
              <Input
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="Enter token symbol"
                className="text-gray-200 bg-transparent rounded-sm mt-1"
              />
            </div>
          </div>

          <div className="mt-4 text-start">
            <Label className="text-gray-100" htmlFor="max_supply">
              Max Supply
            </Label>
            <Input
              id="max_supply"
              name="max_supply"
              type="number"
              value={formData.max_supply}
              onChange={handleInputChange}
              placeholder="Enter max supply"
              className="text-gray-200 bg-transparent rounded-sm mt-1"
            />
          </div>

          {/* <div className="mt-4 text-start">
            <Label className="text-gray-100" htmlFor="uri">
              Token URI
            </Label>
            <Input
              id="uri"
              name="uri"
              value={formData.uri}
              onChange={handleInputChange}
              placeholder="Enter token URI"
              className="text-gray-200 bg-transparent rounded-sm mt-1"
            />
          </div> */}

          <Button
            onClick={onCreateNFT}
            disabled={isCreateNFTLoading || loading}
            className={`w-full text-lg mt-4 ${
              isCreateNFTLoading ? "bg-gradient-to-r from-blue-500 to-white animate-pulse" : success ? "" : ""
            } text-black bg-slate-50 hover:bg-slate-50 font-bold py-2 px-4 rounded`}
          >
            {isCreateNFTLoading ? "Processing..." : success ? "✓ Done!" : "Create NFT"}
          </Button>
        </div>
      ) : (
        <>
          {!address ? (
            <div className="flex justify-center items-center">
              <ConnectButton />
            </div>
          ) : (
            <div className="space-y-6 p-6">
              <div className="flex flex-col gap-3 p-2 rounded-lg">
                <div className="flex space-x-3 items-center text-start justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-400">Total Supply</p>
                    <p className="text-base font-semibold text-gray-100">
                      {ownsAnyUTK ? "1" : "0"} / {totalSupply?.toString()}
                    </p>
                    <p className="text-xs text-gray-400">Minted/Max Supply</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-400">Your Wallet</p>
                    <p className="text-base font-semibold text-gray-100">{ownsAnyUTK ? "Yes" : "No"}</p>
                    <p className="text-xs text-gray-400"> NFT available</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <Button
                  variant="outline"
                  onClick={onClaimNFT}
                  disabled={isClaimNFTLoading}
                  className={`w-full ${
                    isClaimNFTLoading ? "bg-gradient-to-r from-blue-500 to-white animate-pulse" : success ? "" : ""
                  } text-black text-base font-bold py-1 px-4 rounded border border-black`}
                >
                  {isClaimNFTLoading
                    ? "Claiming..."
                    : success
                      ? "✓ Claimed Successfully!"
                      : ownsAnyUTK
                        ? "Already Claimed"
                        : "Claim NFT"}
                </Button>
              </div>

              {success && (
                <div className="bg-white text-gray-900 rounded-md p-2 mt-4">
                  <p className="text-sm text-wrap">
                    Hurray! Unlock creator's exclusive content here:{" "}
                    <a href={generatedUrl} className="text-blue-500 text-xs">
                      {generatedUrl}
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DynamicMint;