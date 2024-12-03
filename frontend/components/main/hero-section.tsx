import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AutoScrollCarouselProps {
  images: string[];
}

const AutoScrollCarousel: React.FC<AutoScrollCarouselProps> = ({ images }) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const scrollInterval = setInterval(() => {
      setScrollPosition((prevPosition) => (prevPosition >= 100 ? 0 : prevPosition + 0.05));
    }, 20);

    return () => clearInterval(scrollInterval);
  }, []);

  return (
    <div className="overflow-hidden w-full rounded">
      <div
        className="flex transition-transform duration-500 ease-linear"
        style={{ transform: `translateX(-${scrollPosition}%)` }}
      >
        {images.concat(images).map((src, index) => (
          <img
            key={index}
            src={src}
            className="h-64 w-full object-cover flex-shrink-0"
            alt={`Carousel image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/create-link");
  };

  const carouselImages = ["/icons/youtube.png", "/icons/twitch.png", "/icons/tiktok.png", "/icons/twitch2.png"];

  return (
    <div className="flex flex-col gap-6 items-center mt-12">
      <div>
        <p className="md:text-5xl text-3xl text-center max-w-4xl font-semibold">Receive YouTube superchats in</p>
        <div className="flex space-x-3 items-center justify-center mt-2">
         <EVMChainCarousel/>
        </div>
      </div>

     
      <p className="text-gray-400 text-sm font-medium max-w-2xl mx-auto text-center">
        Create shareable links to receive SUPERCHATS in any EVM token (powered by Request) from your viewers during live streams. Coming soon
        on Twitch, TikTok, and Instagram!
      </p>

      <div className="flex items-center space-x-3">
        <Button
          onClick={handleGetStarted}
          size={"lg"}
          className="bg-[#CC0000] rounded-full hover:bg-[#CC0000] text-white"
        >
          Get Started Now
        </Button>

        <Button className="bg-transparent hover:bg-transparent rounded-full text-white">
          <img className="h-7 w-7 mr-1" src="/icons/video.svg" alt="Video icon" />
          Watch video
        </Button>
      </div>

      <div className="w-full mt-10">
        <AutoScrollCarousel images={carouselImages} />
      </div>
    </div>
  );
};






const EVMChains = [
  { name: "Avalanche", logo: "/icons/avalanche.svg", color: "#E84142" },
  { name: "Base", logo: "/icons/base.svg", color: "#0052FF" },
  { name: "Ethereum", logo: "/icons/ethereum.svg", color: "#627EEA" },
  { name: "Polygon", logo: "/icons/polygon.svg", color: "#8247E5" },
  { name: "Arbitrum", logo: "/icons/arbitrum.svg", color: "#2B323C" },
  { name: "Optimism", logo: "/icons/optimism.svg", color: "#FF0420" }
];

 const EVMChainCarousel: React.FC = () => {
  const [currentChainIndex, setCurrentChainIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentChainIndex((prev) => (prev + 1) % EVMChains.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const currentChain = EVMChains[currentChainIndex];

  return (
    <div className="flex items-center space-x-3 transition-all duration-500 ease-in-out">
      <img 
        src={currentChain.logo} 
        alt={`${currentChain.name} logo`} 
        className="w-12 h-12 transition-all duration-500"
      />
      <span 
        className="md:text-5xl text-3xl font-bold transition-all duration-500" 
        style={{ color: currentChain.color }}
      >
        {currentChain.name}
      </span>
    </div>
  );
};