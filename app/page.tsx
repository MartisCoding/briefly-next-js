"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [displayedText, setDisplayedText] = useState("");
  const [currentBulletIndex, setCurrentBulletIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const carouselTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fullText = "BRIEF.LY";
  const bullets = [
    "Instant grammar and style corrections",
    "Context-aware suggestions for clarity",
    "Technical writing optimization",
    "Real-time validation as you type",
    "Multi-language support",
    "Industry-standard compliance checks",
  ];

  // Typing animation
  useEffect(() => {
    const typeNextChar = () => {
      setDisplayedText((prev) => {
        if (prev.length < fullText.length) {
          typingTimerRef.current = setTimeout(typeNextChar, 200);
          return fullText.slice(0, prev.length + 1);
        } else {
          setIsTypingComplete(true);
          return prev;
        }
      });
    };

    typingTimerRef.current = setTimeout(typeNextChar, 200);

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  // Bullet carousel
  useEffect(() => {
    carouselTimerRef.current = setInterval(() => {
      setCurrentBulletIndex((prev) => (prev + 1) % bullets.length);
    }, 3000);

    return () => {
      if (carouselTimerRef.current) {
        clearInterval(carouselTimerRef.current);
      }
    };
  }, [bullets.length]);

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-gradient-to-b from-background to-accent/10 px-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Main Title with Typing Animation */}
        <div className="space-y-2">
          <h1 className="text-6xl md:text-8xl font-extrabold text-foreground tracking-tight">
            {displayedText}
            <span
              className={`inline-block w-1 h-16 md:h-24 bg-black ml-1 ${
                isTypingComplete ? "animate-blink" : ""
              }`}
            />
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            AI-powered service for technical task validation
          </p>
        </div>

        {/* CTA Button */}
        <div>
          <button
            onClick={() => router.push("/lint")}
            className="px-8 py-4 bg-black text-white text-lg font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform duration-200"
          >
            Start Validating
          </button>
        </div>

        {/* Carousel of Benefits */}
        <div className="relative h-20 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {bullets.map((bullet, index) => (
              <div
                key={index}
                className={`absolute w-full px-4 transition-all duration-500 ease-in-out ${
                  index === currentBulletIndex
                    ? "translate-x-0 opacity-100"
                    : index < currentBulletIndex
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                  <p className="text-lg md:text-xl text-foreground font-medium">
                    {bullet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 pt-4">
          {bullets.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentBulletIndex
                  ? "w-8 bg-black"
                  : "w-2 bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  );
}