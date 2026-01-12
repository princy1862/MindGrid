"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  IconPlus,
  IconNetwork,
  IconArrowRight,
  IconClock,
  IconGitBranch,
} from "@tabler/icons-react";
import { listProjects } from "@/lib/api";

interface Project {
  project_id: string;
  title: string;
  subject: string;
  total_concepts: number;
  depth_levels: number;
  created_at?: string;
  updated_at?: string;
}

interface ProjectListProps {
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
}

export default function ProjectList({
  onSelectProject,
  onNewProject,
}: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "recent" | "favorites">("all");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await listProjects();
        setProjects(data || []);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="px-6 py-12 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">
            Your Knowledge <span className="text-gradient">Graphs</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Transform your PDFs into interactive brain maps. Manage your current projects or
            start a new analysis below.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Controls */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-3">
            {["all", "recent", "favorites"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  filter === tab
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/50"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <Button
            onClick={onNewProject}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <IconPlus size={20} />
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-slate-700/30 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.project_id}
                onClick={() => onSelectProject(project.project_id)}
                className="group cursor-pointer"
              >
                <Card className="h-full bg-slate-800/60 border-slate-700 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/20 p-6 flex flex-col justify-between overflow-hidden relative"
                >
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-300" />

                  <div className="relative z-10">
                    {/* Subject Badge */}
                    <div className="inline-block bg-purple-600/20 border border-purple-500/50 text-purple-300 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                      {project.subject || "General"}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all">
                      {project.title || "Untitled Project"}
                    </h3>

                    {/* Stats */}
                    <div className="space-y-3 mt-4 text-sm">
                      <div className="flex items-center gap-3 text-slate-300">
                        <IconNetwork size={16} className="text-purple-400" />
                        <span>
                          <span className="font-semibold text-white">
                            {project.total_concepts || 0}
                          </span>{" "}
                          Concepts
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-300">
                        <IconGitBranch size={16} className="text-pink-400" />
                        <span>
                          Depth:{" "}
                          <span className="font-semibold text-white">
                            Lvl {project.depth_levels || 0}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-300">
                        <IconClock size={16} className="text-indigo-400" />
                        <span className="text-xs">
                          {project.updated_at
                            ? new Date(project.updated_at).toLocaleDateString()
                            : "Recently"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Open Button */}
                  <button className="relative z-10 mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all group-hover:shadow-lg group-hover:shadow-purple-600/50">
                    Open Map
                    <IconArrowRight size={16} />
                  </button>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <IconNetwork size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg mb-6">
              No projects yet. Create one to get started!
            </p>
            <Button
              onClick={onNewProject}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-3 rounded-lg"
            >
              <IconPlus size={20} className="mr-2" />
              Create First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
