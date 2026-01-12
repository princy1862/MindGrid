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
  IconZap,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-gradient-to-r from-purple-900/10 to-indigo-900/10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Create Knowledge Graph
          </h1>
          <p className="text-purple-300/70">
            Upload your PDF to extract concepts and build an interactive knowledge map
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upload Area */}
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragOver
              ? "border-purple-400 bg-purple-500/10"
              : "border-purple-500/30 bg-purple-900/20"
          } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-12 text-center">
            {isUploading ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
                </div>
                <div className="space-y-3">
                  <p className="text-lg font-medium text-purple-300">
                    {uploadStage}
                  </p>
                  <Progress value={uploadProgress} className="w-full h-2" />
                  <p className="text-sm text-purple-300/60">
                    {uploadProgress}% Complete
                  </p>
                </div>

                {processingTips.length > 0 && (
                  <div className="bg-purple-900/30 border border-purple-500/20 rounded-lg p-4 backdrop-blur-sm mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <IconSparkles className="h-5 w-5 text-purple-400 animate-pulse" />
                      <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">
                        Fun Fact
                      </span>
                    </div>
                    <p className="text-sm text-purple-300">
                      {processingTips[currentTipIndex]}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                    <IconUpload className="h-12 w-12 text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Drag and drop your PDF
                  </h3>
                  <p className="text-purple-300/70 mb-4">
                    Or click below to browse your files
                  </p>
                  <Button
                    onClick={() => document.getElementById("file-input")?.click()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    <IconFileText className="w-4 h-4 mr-2" />
                    Choose PDF File
                  </Button>
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
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <IconX className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {uploadProgress === 100 && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <IconCheck className="h-5 w-5 text-green-400 flex-shrink-0" />
            <p className="text-green-400">PDF processed successfully!</p>
          </div>
        )}

        {/* Features Section */}
        {!isUploading && uploadProgress === 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              What MindGrid Does
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: IconBrain,
                  title: "AI Analysis",
                  description:
                    "Intelligent extraction of key concepts, definitions, and relationships from your documents",
                },
                {
                  icon: IconNetwork,
                  title: "Knowledge Graph",
                  description:
                    "Visual representation of how concepts connect and relate to each other",
                },
                {
                  icon: IconZap,
                  title: "Smart Learning",
                  description:
                    "Interactive study tools with concept notes, confidence tracking, and more",
                },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 hover:from-purple-900/30 hover:to-indigo-900/30 transition-all duration-300"
                  >
                    <div className="p-3 rounded-lg bg-purple-500/10 w-fit mb-4">
                      <Icon className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-purple-300/70 text-sm">
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
          <div className="mt-8 p-6 rounded-lg border border-green-500/30 bg-green-500/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <IconCheck className="h-6 w-6 text-green-400" />
              <h3 className="text-lg font-bold text-white">
                Knowledge Graph Generated
              </h3>
            </div>
            <p className="text-green-300/70 mb-6">
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
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <IconNetwork className="h-4 w-4" />
              View Knowledge Graph →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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

      // Rotate tips every 3 seconds during processing
      const tipInterval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 3000);

      try {
        // Step 1: Extract text from PDF
        setUploadStage("Extracting text from PDF...");
        setUploadProgress(25);

        const extractData = await extractPDFText(file);
        setUploadProgress(50);

        // Step 2: Create AI digest
        setUploadStage("Creating AI digest...");
        setUploadProgress(60);

        const digestData = await createAIDigest(extractData.text);
        setUploadProgress(80);

        // Step 3: Generate knowledge graph
        setUploadStage("Generating knowledge graph...");
        setUploadProgress(90);

        const graphData = await generateRelationships(digestData.digest_data);
        setUploadProgress(95);

        // Store the knowledge graph
        setGraphData(graphData.graph_data);

        // Step 4: Save to Firebase
        setUploadStage("Saving to Firebase...");
        setUploadProgress(98);

        const saveData = await saveProject(
          digestData.digest_data,
          graphData.graph_data,
          extractData.text // Pass the PDF content!
        );

        // Store PDF in sessionStorage for definition extraction
        console.log("📄 Storing PDF in sessionStorage:", saveData.project_id);
        sessionStorage.setItem(`pdf_${saveData.project_id}`, extractData.text);

        setUploadProgress(100);
        setUploadStage("Complete!");
        clearInterval(tipInterval);

        // Stop the spinner
        setIsUploading(false);

        // Log the project ID for debugging
        console.log("Project saved with ID:", saveData.project_id);

        // Call onComplete callback if provided
        if (onComplete) {
          setTimeout(() => onComplete(), 2000); // Give user time to see success message
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
    <div className="w-full max-w-2xl mx-auto">
      <Card className="p-8 border-cyan-500/30 bg-card/50 backdrop-blur-sm">
        <div className="text-center mb-6">
          <IconFileText className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2 font-mono">
            UPLOAD YOUR PDF
          </h3>
          <p className="text-muted-foreground font-mono">
            DRAG AND DROP YOUR PDF FILE HERE OR CLICK TO BROWSE
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-sm p-8 text-center transition-all duration-300 ${
            isDragOver
              ? "border-cyan-500 bg-cyan-500/10 backdrop-blur-sm"
              : "border-cyan-500/30 bg-card/50 backdrop-blur-sm"
          } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground font-mono">
                  {uploadStage}
                </p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground font-mono">
                  {uploadProgress}% COMPLETE
                </p>
              </div>

              {/* Rotating tips */}
              {processingTips.length > 0 && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <IconSparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs text-cyan-400 font-mono uppercase tracking-wide">
                      Fun Fact
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-mono animate-fade-in">
                    {processingTips[currentTipIndex]}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <IconUpload className="h-8 w-8 text-cyan-400 mx-auto" />
              <div>
                <Button
                  onClick={() => document.getElementById("file-input")?.click()}
                  variant="outline"
                  className="mb-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 font-mono"
                >
                  CHOOSE FILE
                </Button>
                <p className="text-sm text-muted-foreground font-mono">
                  OR DRAG AND DROP YOUR PDF HERE
                </p>
              </div>
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-sm backdrop-blur-sm">
            <div className="flex items-center">
              <IconX className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-400 font-mono">{error}</p>
            </div>
          </div>
        )}

        {uploadProgress === 100 && (
          <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-sm backdrop-blur-sm">
            <div className="flex items-center">
              <IconCheck className="h-5 w-5 text-cyan-400 mr-2" />
              <p className="text-sm text-cyan-400 font-mono">
                PDF PROCESSED SUCCESSFULLY!
              </p>
            </div>
          </div>
        )}

        {graphData && (
          <Card className="mt-6 p-6 border-cyan-500/30 bg-card/50 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-foreground mb-4 font-mono">
              KNOWLEDGE GRAPH
            </h3>
            <div className="mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-sm backdrop-blur-sm">
              <p className="text-sm text-cyan-400 mb-3 font-mono">
                🕸️ KNOWLEDGE GRAPH GENERATED WITH NODES AND RELATIONSHIPS FROM
                THE AI DIGEST.
              </p>
              <button
                onClick={() => {
                  // Store graph data in sessionStorage
                  sessionStorage.setItem(
                    "graphData",
                    JSON.stringify(graphData)
                  );
                  // Navigate to graph page
                  router.push("/graph");
                }}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black rounded-sm font-semibold font-mono tracking-wide transition-colors shadow-sm"
              >
                VIEW KNOWLEDGE GRAPH →
              </button>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}
