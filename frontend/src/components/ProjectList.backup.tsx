"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  IconBrain,
  IconTrash,
  IconPlus,
  IconCalendar,
  IconStar,
  IconFolder,
  IconBookOpen,
  IconEye,
} from "@tabler/icons-react";
import { listProjects, deleteProject } from "@/lib/api";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  subject: string;
  total_concepts: number;
  created_at: string;
  depth_levels?: number;
}

export default function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjects();
    const savedFavorites = localStorage.getItem('favoriteProjects');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await listProjects();
      const mappedProjects: Project[] = (data || []).map(
        (p: Record<string, unknown>) => {
          let title = "Untitled";
          let subject = "Unknown";
          let totalConcepts = 0;

          if (p.title) {
            title = p.title as string;
            subject = (p.subject as string) || "Unknown";
            totalConcepts = (p.total_concepts as number) || 0;
          } else if (p.graph && typeof p.graph === "object") {
            const graph = p.graph as Record<string, unknown>;
            const metadata = graph.graph_metadata as Record<string, unknown>;
            if (metadata) {
              title = (metadata.title as string) || "Untitled";
              subject = (metadata.subject as string) || "Unknown";
              totalConcepts = (metadata.total_concepts as number) || 0;
            }
          }

          return {
            id: (p.id as string) || "",
            title,
            subject,
            total_concepts: totalConcepts,
            created_at: (p.created_at as string) || new Date().toISOString(),
          };
        }
      );
      setProjects(mappedProjects.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (projectId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(projectId)) {
      newFavorites.delete(projectId);
    } else {
      newFavorites.add(projectId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('favoriteProjects', JSON.stringify(Array.from(newFavorites)));
  };

  const getFilteredProjects = () => {
    if (activeTab === 'recent') {
      return projects.slice(0, 5);
    } else if (activeTab === 'favorites') {
      return projects.filter(p => favorites.has(p.id));
    }
    return projects;
  };

  const handleDelete = async (projectId: string, projectTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${projectTitle}"?`)) {
      return;
    }

    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Failed to delete project. Please try again.");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const filteredProjects = getFilteredProjects();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-gradient-to-r from-purple-900/10 to-indigo-900/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Your Projects
              </h1>
              <p className="text-purple-300/70 mt-2">
                {projects.length} project{projects.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <Link
              href="/upload"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-purple-500/50"
            >
              <IconPlus className="w-5 h-5" />
              New Project
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-purple-500/20">
          {(['all', 'recent', 'favorites'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium transition-all duration-200 border-b-2 capitalize ${
                activeTab === tab
                  ? 'text-purple-400 border-purple-400'
                  : 'text-purple-300/60 border-transparent hover:text-purple-300'
              }`}
            >
              {tab === 'all' && `All Projects (${projects.length})`}
              {tab === 'recent' && 'Recent'}
              {tab === 'favorites' && `Favorites (${favorites.size})`}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <IconFolder className="w-16 h-16 text-purple-500/30 mb-4" />
            <h3 className="text-xl font-medium text-purple-300 mb-2">
              {activeTab === 'favorites' ? 'No favorites yet' : 'No projects yet'}
            </h3>
            <p className="text-purple-300/60 text-center max-w-sm mb-6">
              {activeTab === 'favorites' 
                ? 'Star your projects to see them here'
                : 'Create your first project to get started with MindGrid'}
            </p>
            {activeTab !== 'favorites' && (
              <Link
                href="/upload"
                className="px-6 py-2 bg-purple-600/50 hover:bg-purple-600 text-purple-200 rounded-lg transition-colors"
              >
                Create Project
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 hover:from-purple-900/30 hover:to-indigo-900/30 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10"
              >
                {/* Background gradient accent */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative p-6">
                  {/* Header with Title and Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                        {project.title}
                      </h3>
                      <p className="text-sm text-purple-300/60 mt-1">
                        {project.subject}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(project.id)}
                      className="p-2 ml-2 text-purple-400 hover:text-yellow-400 transition-colors flex-shrink-0"
                      title={favorites.has(project.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {favorites.has(project.id) ? (
                        <IconStar className="w-5 h-5 fill-current" />
                      ) : (
                        <IconStar className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Stats Section */}
                  <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-purple-900/30 rounded-lg border border-purple-500/10">
                    <div>
                      <p className="text-xs text-purple-300/60 uppercase tracking-wider">Concepts</p>
                      <p className="text-2xl font-bold text-purple-300">
                        {project.total_concepts}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-300/60 uppercase tracking-wider">Depth</p>
                      <p className="text-2xl font-bold text-indigo-300">
                        {project.depth_levels || 1}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-purple-300/50">
                      {formatDate(project.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-300/70 text-xs">
                      <IconBookOpen className="w-3 h-3" />
                      Active
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/project/${project.id}`}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <IconEye className="w-4 h-4" />
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id, project.title)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-500/20 hover:border-red-500/30"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
