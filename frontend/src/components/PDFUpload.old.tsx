"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  IconUpload,
  IconSparkles,
  IconNetwork,
  IconCheckCircle,
  IconAlertCircle,
} from "@tabler/icons-react";
import { processPDF } from "@/lib/api";

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

  const tips = [
    "🤖 AI is reading your PDF like a speed reader",
    "🧠 Building your brain map concept by concept",
    "⚡ Creating neural connections in real-time",
    "✨ Transforming your textbook into genius mode",
    "🚀 Your knowledge graph is almost ready",
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        handleUpload(files[0]);
      }
    },
    []
  );

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadProgress(0);
    setUploadStage("");

    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);

    try {
      const projectId = await processPDF(file, (stage, progress) => {
        setUploadStage(stage);
        setUploadProgress(progress);
      });

      clearInterval(tipInterval);
      setIsUploading(false);
      setUploadProgress(100);
      setUploadStage("✅ Complete! Redirecting...");

      setTimeout(() => {
        sessionStorage.setItem("currentProjectId", projectId);
        router.push(`/project/${projectId}`);
        if (onComplete) onComplete();
      }, 1500);
    } catch (err) {
      clearInterval(tipInterval);
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="px-6 py-8 border-b border-slate-700">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-white transition-colors mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            Upload New <span className="text-gradient">Project</span>
          </h1>
          <p className="text-slate-400">
            Transform your textbooks into interactive brain maps. Let our AI handle the complexity.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        {!isUploading ? (
          <>
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all mb-12 ${
                isDragOver
                  ? "border-purple-500 bg-purple-600/10"
                  : "border-slate-600 bg-slate-800/30 hover:border-purple-500/50"
              }`}
            >
              <IconUpload
                size={64}
                className={`mx-auto mb-6 ${
                  isDragOver ? "text-purple-400" : "text-slate-500"
                }`}
              />

              <h2 className="text-3xl font-bold text-white mb-2">
                Drag & Drop your PDF
              </h2>
              <p className="text-slate-400 mb-6">
                or click the button below to browse your files
              </p>

              <label htmlFor="pdf-input">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl cursor-pointer">
                  <IconUpload size={20} className="mr-2" />
                  Choose PDF File
                </Button>
              </label>
              <input
                id="pdf-input"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />

              <p className="text-slate-500 text-sm mt-4">
                Supports PDF files up to 50MB
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800/60 border-slate-700 p-6 hover:border-purple-500/50 transition-all">
                <div className="bg-purple-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <IconSparkles size={24} className="text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  AI Analysis
                </h3>
                <p className="text-slate-400 text-sm">
                  Instant concept extraction and summarization powered by advanced AI
                </p>
              </Card>

              <Card className="bg-slate-800/60 border-slate-700 p-6 hover:border-pink-500/50 transition-all">
                <div className="bg-pink-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <IconNetwork size={24} className="text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Knowledge Graph
                </h3>
                <p className="text-slate-400 text-sm">
                  Visualize deep connections between concepts interactively
                </p>
              </Card>

              <Card className="bg-slate-800/60 border-slate-700 p-6 hover:border-indigo-500/50 transition-all">
                <div className="bg-indigo-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <IconCheckCircle size={24} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Smart Study
                </h3>
                <p className="text-slate-400 text-sm">
                  Generate quizzes, guides, and personalized learning paths
                </p>
              </Card>
            </div>

            {error && (
              <div className="mt-8 bg-red-600/20 border border-red-600/50 rounded-lg p-4 flex items-start gap-3">
                <IconAlertCircle size={20} className="text-red-400 mt-1 flex-shrink-0" />
                <p className="text-red-200">{error}</p>
              </div>
            )}
          </>
        ) : (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-purple-600 animate-spin" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {uploadStage}
            </h2>

            <div className="w-full max-w-md mt-8 bg-slate-800/60 rounded-xl p-6">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Progress</span>
                  <span className="text-sm font-semibold text-purple-400">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>

              {/* Tips */}
              <div className="text-center">
                <p className="text-slate-300 text-sm">
                  {tips[currentTipIndex]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
