"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import {
  IconArrowLeft,
  IconGraph,
  IconBook,
  IconFileText,
  IconVolume,
  IconRefresh,
  IconBrain,
  IconCalendar,
  IconLayersLinked,
  IconDownload,
} from "@tabler/icons-react";
import {
  getProject,
  generateOverview,
  generateAudioScript,
  generateAudio,
} from "@/lib/api";

interface ProjectData {
  title: string;
  subject: string;
  total_concepts: number;
  depth_levels: number;
  created_at: string;
  graph_data?: Record<string, unknown>;
  digest_data?: Record<string, unknown>;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<string>("");
  const [generatingOverview, setGeneratingOverview] = useState(false);
  const [audioScript, setAudioScript] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [generatingAudio, setGeneratingAudio] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const response = await getProject(projectId);
        if (response.project_data) {
          setProject(response.project_data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const handleViewGraph = () => {
    if (project?.graph_data) {
      sessionStorage.setItem("graphData", JSON.stringify(project.graph_data));
      sessionStorage.setItem("currentProjectId", projectId);
      router.push("/graph");
    }
  };

  const handleGenerateStudyGuide = async () => {
    if (!project?.digest_data) return;

    try {
      setGeneratingOverview(true);
      const response = await generateOverview(project.digest_data, project.graph_data);
      setOverview(response.overview_text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate study guide");
    } finally {
      setGeneratingOverview(false);
    }
  };

  const handleDownloadStudyGuide = () => {
    if (!overview || !project) return;
    const blob = new Blob([overview], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "study-guide"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateAudio = async () => {
    if (!project?.digest_data) return;

    try {
      setGeneratingAudio(true);
      const scriptResponse = await generateAudioScript(project.digest_data, project.graph_data);
      setAudioScript(scriptResponse.script_text);

      const audioResponse = await generateAudio(scriptResponse.script_text);
      setAudioUrl(audioResponse.audio_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setGeneratingAudio(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" showText={true} />
          <p className="text-gray-500 mt-4">Loading your PDFs...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
          <p className="text-gray-600 mb-6">{error || "Unable to load project"}</p>
          <Button onClick={() => router.push("/projects")} className="bg-gray-900 hover:bg-gray-800 text-white">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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

      {/* Main Content */}
      <main className="flex-1 px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            onClick={() => router.push("/projects")}
            variant="ghost"
            className="mb-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <IconArrowLeft className="mr-2 h-4 w-4" />
             Back to Projects
          </Button>

          {/* Project Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.title}</h1>
          <div className="flex items-center gap-6 text-gray-600 mb-8">
            <span className="flex items-center gap-2">
              <IconBook className="h-4 w-4 text-purple-600" />
              {project.subject}
            </span>
            <span className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-purple-600" />
              {new Date(project.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Total Concepts</p>
                <p className="text-4xl font-bold text-gray-900">{project.total_concepts}</p>
              </div>
              <IconBrain className="h-12 w-12 text-purple-500" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Depth Levels</p>
                <p className="text-4xl font-bold text-gray-900">{project.depth_levels}</p>
              </div>
              <IconLayersLinked className="h-12 w-12 text-purple-500" />
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Knowledge Graph Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
              <IconGraph className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Knowledge Graph</h3>
              <p className="text-gray-600 mb-6">
                Explore the interactive visualization of concepts and their relationships
              </p>
              <Button
                onClick={handleViewGraph}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                disabled={!project.graph_data}
              >
                <IconGraph className="mr-2 h-4 w-4" />
                View Graph 
              </Button>
            </div>

            {/* Study Guide Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
              <IconBook className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Study Guide</h3>
              <p className="text-gray-600 mb-6">
                Generate a comprehensive markdown cheatsheet for download
              </p>
              {overview ? (
                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerateStudyGuide}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold"
                    disabled={generatingOverview}
                  >
                    <IconRefresh className={`mr-2 h-4 w-4 ${generatingOverview ? "animate-spin" : ""}`} />
                    {generatingOverview ? "Generating..." : "Regenerate"}
                  </Button>
                  <Button
                    onClick={handleDownloadStudyGuide}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                  >
                    <IconDownload className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateStudyGuide}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                  disabled={generatingOverview || !project.digest_data}
                >
                  <IconRefresh className={`mr-2 h-4 w-4 ${generatingOverview ? "animate-spin" : ""}`} />
                  {generatingOverview ? "Generating..." : "Generate"}
                </Button>
              )}
            </div>
          </div>

          {/* Study Guide Preview */}
          {overview && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Study Guide Preview</h3>
              <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap break-words">
                  {overview}
                </pre>
              </div>
            </div>
          )}

          {/* Audio Lecture Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
            <IconVolume className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Audio Lecture</h3>
            <p className="text-gray-600 mb-6">
              Generate an AI-narrated audio explanation of the concepts
            </p>
            {audioUrl ? (
              <audio controls className="w-full mb-4">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            ) : null}
            <Button
              onClick={handleGenerateAudio}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold"
              disabled={generatingAudio || !project.digest_data}
            >
              <IconRefresh className={`mr-2 h-4 w-4 ${generatingAudio ? "animate-spin" : ""}`} />
              {generatingAudio ? "Generating..." : audioUrl ? "Regenerate " : "Generate "}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
