"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import {
  IconArrowRight,
  IconBrain,
  IconBoltFilled,
  IconFlameFilled,
} from "@tabler/icons-react";

export default function IntroPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [showElements, setShowElements] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Trigger animations on mount
    const timer1 = setTimeout(() => setIsVisible(true), 100);
    const timer2 = setTimeout(() => setShowElements(true), 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleGetStarted = () => {
    setIsTransitioning(true);
    localStorage.setItem("hasSeenIntro", "true");

    // Wait for animation to complete before navigating
    setTimeout(() => {
      router.push("/projects");
    }, 800);
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-800 ${
        isTransitioning
          ? "opacity-0 scale-95 blur-sm"
          : "opacity-100 scale-100 blur-0"
      }`}
    >
      {/* Main content */}
      <div className="text-center z-10 max-w-4xl mx-auto px-6">
        {/* Logo */}
        <div
          className={`mb-8 transition-all duration-1000 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <Logo size="lg" showText={false} className="justify-center" />
        </div>

        {/* Title */}
        <h1
          className={`text-7xl md:text-8xl font-bold text-gray-900 mb-8 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{
            transitionDelay: "200ms",
            fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "-0.02em",
          }}
        >
          MindGrid
        </h1>

        {/* Main message */}
        <div
          className={`mb-8 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "300ms" }}
        >
          <p className="text-xl md:text-2xl text-gray-700 mb-4">
            Stop drowning in the pages; <span className="italic">start mastering the concepts</span>
          </p>
          <p className="text-lg md:text-xl text-gray-600 mb-4">
            Ditch the 200-page wall of text→ Walk through <span className="italic">the mental floor plan</span> that makes sense
          </p>
          <p className="text-gray-600">
            On god, I’m never reading a raw PDF again 🙅‍♂️
          </p>
        </div>

        {/* CTA Button */}
        <div
          className={`mb-8 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 text-lg"
          >
            LET&apos;S WHIP UP SOME CONCEPTS →
          </Button>
        </div>

        {/* Footer text */}
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          <p className="text-sm text-gray-600">
            Ditch <span className="text-gray-700">the document-induced headache</span> • Unlock the <span className="text-gray-700">'Aha!' moment</span>
          </p>
        </div>
      </div>

      {/* Loading overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center z-50">
          <div className="text-center">
            <Logo size="lg" showText={true} />
            <p className="text-gray-500 mt-4">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
