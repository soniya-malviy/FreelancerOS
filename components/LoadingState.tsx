"use client";

import { useState, useEffect } from "react";

const messages = [
  "Reading the job post...",
  "Matching with your experience...",
  "Crafting your opening line...",
  "Writing your proposal...",
];

export default function LoadingState() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute inset-0 border-4 border-primary-light rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-transparent border-b-primary/50 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }}></div>
      </div>

      {/* Rotating message */}
      <div className="h-8 flex items-center justify-center">
        <p
          key={currentIndex}
          className="text-lg font-medium text-foreground animate-fade-in"
        >
          {messages[currentIndex]}
        </p>
      </div>

      {/* Subtle dots */}
      <div className="flex gap-1.5 mt-4">
        {messages.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i === currentIndex
                ? "bg-primary scale-125"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
