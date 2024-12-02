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
    navigate("/dashboard");
  };

  const carouselImages = ["/icons/youtube.png", "/icons/twitch.png", "/icons/tiktok.png", "/icons/twitch2.png"];

  return (
    <div className="flex flex-col gap-6 items-center mt-12">
      <div>
        <p className="md:text-5xl text-3xl text-center max-w-4xl font-semibold">Receive YouTube superchats in</p>
        <div className="flex space-x-3 items-center justify-center mt-2">
          <img src="/icons/aurora.svg" className="w-14 h-14" />
          <p className="md:text-5xl text-3xl text-center max-w-4xl font-semibold text-[#5DEB5A]">Aurora <span className="text-white">Tokens </span></p>
        </div>
      </div>

      {/* <p className="md:text-5xl text-3xl text-center max-w-4xl font-semibold">
        Support your favorite creators with <span className="text-[#5DEB5A]">Near</span> Tokens
      </p> */}
      <p className="text-gray-400 text-sm font-medium max-w-2xl mx-auto text-center">
        Create shareable links to receive SUPERCHATS in Near tokens from your viewers during live streams. Coming soon
        on Twitch, TikTok, and Instagram!
      </p>

      <div className="flex items-center space-x-3">
        <Button
          onClick={handleGetStarted}
          size={"lg"}
          className="bg-[#5DEB5A] rounded-full hover:bg-[#5DEB5A] text-white"
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
