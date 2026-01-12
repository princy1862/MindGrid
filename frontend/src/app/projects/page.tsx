"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import PDFUpload from "@/components/PDFUpload";
import Logo from "@/components/Logo";
import { listProjects } from "@/lib/api";

interface Project {
  id: string;
  title: string;
  subject: string;
  total_concepts: number;
  depth_levels: number;
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has seen intro
    const introSeen = localStorage.getItem("hasSeenIntro");
    if (!introSeen) {
      router.push("/");
    } else {
      setHasSeenIntro(true);
      // Trigger fade-in animation after a short delay
      setTimeout(() => setIsVisible(true), 100);
      // Load projects
      loadProjects();
    }
  }, [router]);

  const loadProjects = async () => {
    try {
      const data = await listProjects();
      setProjects(data as Project[] || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasSeenIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" showText={true} />
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-gray-50 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-200 backdrop-blur-sm bg-white/80">
        <Logo size="md" showText={true} />
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-mono text-sm"
          >
            Intro
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-12">
        {!showUpload ? (
          <div className="max-w-6xl mx-auto">
            {/* Title Section */}
            <div className="mb-12">
              <div className="text-sm font-semibold text-purple-600 mb-2 uppercase tracking-wide">Dashboard</div>
              <h1 className="text-5xl font-bold text-gray-900 mb-3">
                Your Knowledge <span className="text-purple-600">Graphs</span>
              </h1>
              <p className="text-gray-600 text-lg">
                Transform your PDFs into interactive brain maps. Manage your current projects or start a new analysis below.
              </p>
            </div>

            {/* Tabs and New Project Button */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium text-sm">
                  All Projects
                </button>
              </div>
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2"
              >
                <IconPlus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>

            {/* Projects Grid */}
            {!loading && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/project/${project.id}`)}
                    className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all hover:border-purple-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-purple-600 mb-1">{project.subject}</p>
                        <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <span>✦</span>
                        <span>{project.total_concepts} Nodes</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <span>📅</span>
                        <span>{new Date(project.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium">
                      Open Map
                    </Button>
                  </div>
                ))}
                
                {/* Create New Project Card */}
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                  onClick={() => setShowUpload(true)}>
                  <div className="text-4xl mb-3">+</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Create New Project</h3>
                  <p className="text-sm text-gray-600">
                    Upload a PDF textbook to generate a new knowledge graph
                  </p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <Logo size="lg" showText={true} />
                <p className="text-gray-500 mt-4">Loading projects...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96">
                <p className="text-gray-400 font-mono mb-6">No projects yet</p>
                <Button
                  onClick={() => setShowUpload(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3"
                >
                  <IconPlus className="mr-2 h-5 w-5" />
                  Create First Project
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <Button
              onClick={() => setShowUpload(false)}
              variant="ghost"
              className="mb-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              ← Back to Dashboard
            </Button>

            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold text-gray-900 mb-3">
                Upload New <span className="text-purple-600">Project</span>
              </h2>
              <p className="text-gray-600 text-lg">
                Transform your textbooks into interactive brain maps. Let our AI handle the complexity.
              </p>
            </div>

            {/* Upload Section */}
            <PDFUpload onComplete={() => {
              setShowUpload(false);
              loadProjects();
            }} />
          </div>
        )}
      </main>
    </div>
  );
}
