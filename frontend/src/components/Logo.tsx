"use client";

import Link from "next/link";
import { useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({
  size = "md",
  showText = true,
  className = "",
}: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: { icon: "h-8 w-8", text: "text-lg" },
    md: { icon: "h-10 w-10", text: "text-2xl" },
    lg: { icon: "h-12 w-12", text: "text-3xl" },
  };

  return (
    <Link
      href="/"
      className={`flex items-center space-x-3 cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Purple rounded square icon with bars */}
      <div
        className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 transition-transform duration-300 shadow-lg ${
          sizeClasses[size].icon
        } ${isHovered ? "scale-110" : "scale-100"}`}
      >
        <div className="flex items-center justify-center gap-1">
          {/* Three vertical bars */}
          <div className="w-1 h-5 bg-white rounded-full opacity-90"></div>
          <div className="w-1 h-6 bg-white rounded-full opacity-90"></div>
          <div className="w-1 h-5 bg-white rounded-full opacity-90"></div>
        </div>
      </div>

      {showText && (
        <h1 className={`font-bold tracking-tight text-gray-900 font-sans ${sizeClasses[size].text}`}>
          MindGrid
        </h1>
      )}
    </Link>
  );
}
