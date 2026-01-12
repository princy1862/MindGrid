"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { IconArrowLeft } from "@tabler/icons-react";

export default function GraphPage() {
  const router = useRouter();
  const [graphData, setGraphData] = useState<Record<string, unknown> | null>(
    null
  );
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Get graph data and project ID from sessionStorage
    const storedData = sessionStorage.getItem("graphData");
    const storedProjectId = sessionStorage.getItem("currentProjectId");

    if (storedProjectId) {
      setProjectId(storedProjectId);
    }

    if (storedData && storedData !== "undefined" && storedData !== "null") {
      try {
        const parsed = JSON.parse(storedData);
        setGraphData(parsed);
      } catch (err) {
        console.error("Failed to parse graph data:", err);
        setError("Invalid graph data");
      }
    } else {
      setError("No graph data found");
    }
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-6 border-b border-gray-200 backdrop-blur-sm bg-white/80">
          <Logo size="md" showText={true} />
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-sm"
          >
            Intro
          </Button>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {error}
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              Please select a project from the home page to view its graph.
            </p>
            <Button
              onClick={() => router.push("/projects")}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold"
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-6 border-b border-gray-200 backdrop-blur-sm bg-white/80">
          <Logo size="md" showText={true} />
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-sm"
          >
            Intro
          </Button>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Logo size="lg" showText={true} />
            <p className="text-gray-500 mt-4">Loading graph data...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (projectId) {
      router.push(`/project/${projectId}`);
    } else {
      router.push("/projects");
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to {projectId ? "Project" : "Projects"}
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Logo size="md" showText={true} />
        </div>
      </div>

      {/* Fullscreen Graph */}
      <div className="flex-1 overflow-hidden">
        <KnowledgeGraph
          graphData={
            graphData as {
              nodes: Array<{ name: string; ins: string[]; outs: string[] }>;
              graph_metadata: {
                title: string;
                subject: string;
                total_concepts: number;
                depth_levels: number;
              };
            }
          }
          projectId={projectId || ""}
          onSaveNotes={async () => {}}
          onSaveConfidence={async () => {}}
        />
      </div>
    </div>
  );
}
