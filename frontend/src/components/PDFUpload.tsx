"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  IconUpload,
  IconFileText,
  IconX,
  IconCheck,
  IconSparkles,
  IconBrain,
  IconNetwork,
  IconBolt,
} from "@tabler/icons-react";
import {
  extractPDFText,
  createAIDigest,
  generateRelationships,
  saveProject,
} from "@/lib/api";

interface PDFUploadProps {
  onComplete?: () => void;
}

export default function PDFUpload({ onComplete }: PDFUploadProps = {}) {
  const router = useRouter();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [error, setError] = useState("");
  const [graphData, setGraphData] = useState<Record<string, unknown> | null>(
    null
  );
  const [processingTips, setProcessingTips] = useState<string[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    "💡 AI is reading your PDF like a speed reader on caffeine",
    "🧠 Your brain map is being constructed node by node",
    "⚡ Knowledge connections are being forged in real-time",
    "🔥 Turning your boring textbook into comeback material",
    "✨ Almost ready to make your study game strong",
    "🚀 Your knowledge graph is about to go live",
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }

      setIsUploading(true);
      setError("");
      setUploadProgress(0);
      setUploadStage("Processing PDF...");
      setProcessingTips(tips);
      setCurrentTipIndex(0);

      const tipInterval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 3000);

      try {
        setUploadStage("Extracting text from PDF...");
        setUploadProgress(25);

        const extractData = await extractPDFText(file);
        setUploadProgress(50);

        setUploadStage("Creating AI digest...");
        setUploadProgress(60);

        const digestData = await createAIDigest(extractData.text);
        setUploadProgress(80);

        setUploadStage("Generating knowledge graph...");
        setUploadProgress(90);

        const graphData = await generateRelationships(digestData.digest_data);
        setUploadProgress(95);

        setGraphData(graphData.graph_data);

        setUploadStage("Saving to Firebase...");
        setUploadProgress(98);

        const saveData = await saveProject(
          digestData.digest_data,
          graphData.graph_data,
          extractData.text
        );

        console.log("📄 Storing PDF in sessionStorage:", saveData.project_id);
        sessionStorage.setItem(`pdf_${saveData.project_id}`, extractData.text);

        setUploadProgress(100);
        setUploadStage("Complete!");
        clearInterval(tipInterval);

        setIsUploading(false);

        console.log("Project saved with ID:", saveData.project_id);

        if (onComplete) {
          setTimeout(() => onComplete(), 2000);
        }
      } catch (err) {
        clearInterval(tipInterval);
        setError(err instanceof Error ? err.message : "Upload failed");
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStage("");
        setProcessingTips([]);
        setCurrentTipIndex(0);
      }
    },
    [onComplete, tips]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const pdfFile = files.find((file) => file.type === "application/pdf");

      if (pdfFile) {
        handleFileUpload(pdfFile);
      } else {
        setError("Please upload a PDF file");
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed transition-all duration-300 ${
          isDragOver
            ? "border-purple-400 bg-purple-50"
            : "border-gray-300 bg-white"
        } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-16 text-center">
          {isUploading ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-purple-300 border-t-purple-600 animate-spin"></div>
              </div>
              <div className="space-y-3">
                <p className="text-lg font-medium text-gray-900">
                  {uploadStage}
                </p>
                <Progress value={uploadProgress} className="w-full h-2" />
                <p className="text-sm text-gray-600">
                  {uploadProgress}% Complete
                </p>
              </div>

              {processingTips.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 backdrop-blur-sm mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <IconSparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                    <span className="text-xs text-purple-600 font-medium uppercase tracking-wider">
                      Processing
                    </span>
                  </div>
                  <p className="text-sm text-purple-900">
                    {processingTips[currentTipIndex]}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <IconUpload className="h-10 w-10 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Drag & Drop your PDF
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  or click below to browse your files
                </p>
                <Button
                  onClick={() => document.getElementById("file-input")?.click()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg"
                >
                  Select Document
                </Button>
                <p className="text-xs text-gray-500 mt-4">
                  Supports PDF (Max 50MB)
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <IconX className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {uploadProgress === 100 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <IconCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">PDF processed successfully!</p>
        </div>
      )}

      {/* Features Section */}
      {!isUploading && uploadProgress === 0 && (
        <div className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: IconBrain,
                title: "AI Analysis",
                description:
                  "Instant concept extraction and summarization.",
              },
              {
                icon: IconNetwork,
                title: "Knowledge Graph",
                description:
                  "Visualize deep connections between topics.",
              },
              {
                icon: IconBolt,
                title: "Smart Study",
                description:
                  "Tailored quizzes based on your material.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all"
                >
                  <div className="p-2 rounded-lg bg-purple-100 w-fit mb-3">
                    <Icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Knowledge Graph Result */}
      {graphData && (
        <div className="p-6 rounded-lg border border-green-200 bg-green-50">
          <div className="flex items-center gap-3 mb-4">
            <IconCheck className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Knowledge Graph Generated
            </h3>
          </div>
          <p className="text-green-800 mb-6">
            Your knowledge graph has been successfully created with concepts and relationships extracted from your PDF.
          </p>
          <button
            onClick={() => {
              sessionStorage.setItem(
                "graphData",
                JSON.stringify(graphData)
              );
              router.push("/graph");
            }}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <IconNetwork className="h-4 w-4" />
            View Knowledge Graph →
          </button>
        </div>
      )}
    </div>
  );
}
