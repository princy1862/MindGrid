"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface ConfidenceRatingProps {
  confidence: number | null;
  onChange: (rating: number | null) => void;
  readonly?: boolean;
}

export default function ConfidenceRating({ confidence, onChange, readonly = false }: ConfidenceRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const getColor = (rating: number) => {
    if (rating >= 4) return "text-green-400";
    if (rating >= 3) return "text-yellow-400";
    if (rating >= 1) return "text-red-400";
    return "text-gray-400";
  };

  const getBgColor = (rating: number) => {
    if (rating >= 4) return "bg-green-400/20";
    if (rating >= 3) return "bg-yellow-400/20";
    if (rating >= 1) return "bg-red-400/20";
    return "bg-gray-400/20";
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = (hoveredRating ?? confidence ?? 0) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange(confidence === star ? null : star)}
            onMouseEnter={() => !readonly && setHoveredRating(star)}
            onMouseLeave={() => !readonly && setHoveredRating(null)}
            className={`p-1 rounded transition-colors ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } ${isActive ? getBgColor(star) : "hover:bg-gray-400/10"}`}
          >
            <Star
              className={`w-4 h-4 ${isActive ? getColor(star) : "text-gray-400"} ${
                isActive ? "fill-current" : ""
              }`}
            />
          </button>
        );
      })}
      {confidence && (
        <span className="ml-2 text-xs text-muted-foreground">
          {confidence === 5 && "Mastered"}
          {confidence === 4 && "Confident"}
          {confidence === 3 && "Learning"}
          {confidence === 2 && "Struggling"}
          {confidence === 1 && "Need Help"}
        </span>
      )}
    </div>
  );
}