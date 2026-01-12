"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  IconDownload,
  IconVolume,
  IconRefresh,
  IconArrowLeft,
  IconFileText,
  IconCards,
  IconFile,
} from "@tabler/icons-react";
import KnowledgeGraph from "./KnowledgeGraph";
import {
  getProject,
  generateOverview,
  generateAudioScript,
  generateAudio,
  updateConceptNotes,
  updateConceptConfidence,
} from "@/lib/api";
import { ProjectData } from "@/types/graph";

interface ProjectViewProps {
  projectId: string;
  onBack: () => void;
}

export default function ProjectView({ projectId, onBack }: ProjectViewProps) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [overview, setOverview] = useState<string>("");
  const [audioScript, setAudioScript] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generatingOverview, setGeneratingOverview] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [error, setError] = useState("");
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProject(projectId);
      setProjectData(response.project_data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleGenerateOverview = async () => {
    if (!projectData?.reference) return;

    try {
      setGeneratingOverview(true);
      // Use reference (digest) data as primary input, with graph data as optional context
      const response = await generateOverview(
        projectData.reference,
        projectData.graph
      );
      setOverview(response.overview_text);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate overview"
      );
    } finally {
      setGeneratingOverview(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!projectData?.reference) return;

    try {
      setGeneratingAudio(true);

      // Generate script first using digest data
      const scriptResponse = await generateAudioScript(
        projectData.reference,
        projectData.graph
      );
      setAudioScript(scriptResponse.script_text);

      // Then generate audio from script
      const audioResponse = await generateAudio(scriptResponse.script_text);

      // audio_url is already a data URL (data:audio/mpeg;base64,...)
      setAudioUrl(audioResponse.audio_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setGeneratingAudio(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;

    // Create download link
    const a = document.createElement("a");
    a.href = audioUrl;
    const title = projectData?.graph?.graph_metadata?.title || "study-guide";
    const cleanFilename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    a.download = `${cleanFilename}-audio.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadOverview = () => {
    if (!overview) return;

    // Create a clean filename from the title
    const title = projectData?.graph?.graph_metadata?.title || "study-guide";
    const cleanFilename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const blob = new Blob([overview], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanFilename}-cheatsheet.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveNotes = async (conceptName: string, notes: string) => {
    try {
      await updateConceptNotes(projectId, conceptName, notes);
      // Reload project data to reflect changes
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
    }
  };

  const handleSaveConfidence = async (conceptName: string, confidence: number | null) => {
    try {
      await updateConceptConfidence(projectId, conceptName, confidence);
      // Reload project data to reflect changes
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save confidence");
    }
  };

  const generateFormulaSheet = () => {
    if (!projectData?.digest) return;

    const title = projectData.graph?.graph_metadata?.title || "Formula Sheet";
    const digest = projectData.digest;

    let markdown = `# ${title} - Formula Sheet\n\n`;
    markdown += `Generated from MindGrid AI Analysis\n\n`;

    // Extract formulas from digest data
    const keyFormulas = digest.key_formulas;
    if (Array.isArray(keyFormulas) && keyFormulas.length > 0) {
      markdown += `## Key Formulas\n\n`;
      keyFormulas.forEach((formula: string) => {
        markdown += `• ${formula}\n`;
      });
      markdown += `\n`;
    }

    // Extract properties and rules
    const propertiesRules = digest.properties_rules;
    if (Array.isArray(propertiesRules) && propertiesRules.length > 0) {
      markdown += `## Properties & Rules\n\n`;
      propertiesRules.forEach((rule: string) => {
        markdown += `• ${rule}\n`;
      });
      markdown += `\n`;
    }

    // Extract techniques and methods
    const techniquesMethods = digest.techniques_methods;
    if (Array.isArray(techniquesMethods) && techniquesMethods.length > 0) {
      markdown += `## Techniques & Methods\n\n`;
      techniquesMethods.forEach((technique: string) => {
        markdown += `• ${technique}\n`;
      });
      markdown += `\n`;
    }

    // Extract specific examples with formulas
    const specificExamples = digest.specific_examples;
    if (Array.isArray(specificExamples) && specificExamples.length > 0) {
      markdown += `## Examples\n\n`;
      specificExamples.forEach((example: string) => {
        markdown += `• ${example}\n`;
      });
      markdown += `\n`;
    }

    // Extract important notes
    const importantNotes = digest.important_notes;
    if (Array.isArray(importantNotes) && importantNotes.length > 0) {
      markdown += `## Important Notes\n\n`;
      importantNotes.forEach((note: string) => {
        markdown += `• ${note}\n`;
      });
      markdown += `\n`;
    }

    // Create download
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanFilename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    a.download = `${cleanFilename}-formulas.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToObsidian = () => {
    if (!projectData) return;

    const title = projectData.graph?.graph_metadata?.title || "Knowledge Graph";
    const nodes = projectData.graph?.nodes || [];

    let markdown = `# ${title}\n\n`;
    markdown += `Generated from MindGrid - ${nodes.length} concepts\n\n`;

    // Create a hierarchical structure
    const processed = new Set<string>();
    const processNode = (nodeName: string, level = 0) => {
      if (processed.has(nodeName)) return;
      processed.add(nodeName);

      const node = nodes.find(n => n.name === nodeName);
      if (!node) return;

      const indent = "  ".repeat(level);
      markdown += `${indent}- **${nodeName}**\n`;

      if (node.notes) {
        markdown += `${indent}  - *Notes:* ${node.notes}\n`;
      }

      // Add outgoing connections
      node.outs.forEach(out => {
        if (!processed.has(out)) {
          processNode(out, level + 1);
        }
      });
    };

    // Start with root nodes (nodes with no incoming connections)
    const rootNodes = nodes.filter(node => node.ins.length === 0);
    rootNodes.forEach(node => processNode(node.name));

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToAnki = () => {
    if (!projectData) return;

    const title = projectData.graph?.graph_metadata?.title || "Knowledge Graph";
    const nodes = projectData.graph?.nodes || [];

    let csv = "Question;Answer;Tags\n";

    nodes.forEach(node => {
      const question = `What is ${node.name}?`;
      let answer = `**${node.name}** is a concept in ${title}.\n\n`;

      if (node.notes) {
        answer += `Notes: ${node.notes}\n\n`;
      }

      // Add related concepts
      if (node.ins.length > 0) {
        answer += `Prerequisites: ${node.ins.join(", ")}\n`;
      }
      if (node.outs.length > 0) {
        answer += `Leads to: ${node.outs.join(", ")}\n`;
      }

      const tags = `${title.replace(/[^a-z0-9]/gi, "_")},mindgrid`;
      csv += `"${question}";"${answer}";"${tags}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_anki.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!projectData) return;

    const title = projectData.graph?.graph_metadata?.title || "Knowledge Graph";
    const nodes = projectData.graph?.nodes || [];

    let markdown = `# ${title}\n\n`;
    markdown += `Study Guide - ${nodes.length} concepts\n\n`;

    nodes.forEach(node => {
      markdown += `## ${node.name}\n\n`;
      if (node.notes) {
        markdown += `**Notes:** ${node.notes}\n\n`;
      }
      if (node.ins.length > 0) {
        markdown += `**Prerequisites:** ${node.ins.join(", ")}\n\n`;
      }
      if (node.outs.length > 0) {
        markdown += `**Leads to:** ${node.outs.join(", ")}\n\n`;
      }
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_study_guide.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={loadProject} variant="outline">
          <IconRefresh className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-300">Project not found</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {projectData.graph?.graph_metadata?.title || "Knowledge Graph"}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {projectData.graph?.graph_metadata?.subject} •{" "}
              {projectData.graph?.graph_metadata?.total_concepts} concepts
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={exportToObsidian} variant="outline" size="sm">
            <IconFileText className="mr-2 h-4 w-4" />
            Obsidian
          </Button>
          <Button onClick={exportToAnki} variant="outline" size="sm">
            <IconCards className="mr-2 h-4 w-4" />
            Anki
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <IconFile className="mr-2 h-4 w-4" />
            Study Guide
          </Button>
          <Button onClick={generateFormulaSheet} variant="outline" size="sm">
            <IconFile className="mr-2 h-4 w-4" />
            Formula Sheet
          </Button>
          <Button onClick={() => setShowProgressDashboard(true)} variant="outline" size="sm">
            <IconRefresh className="mr-2 h-4 w-4" />
            Progress
          </Button>
        </div>
      </div>

      {/* Knowledge Graph */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Interactive Knowledge Graph
        </h2>
        <KnowledgeGraph
          graphData={projectData.graph}
          projectId={projectId}
          onSaveNotes={handleSaveNotes}
          onSaveConfidence={handleSaveConfidence}
        />
      </Card>

      {/* Study Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Study Guide & Cheatsheet
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateOverview}
                disabled={generatingOverview}
                size="sm"
                variant="outline"
              >
                {generatingOverview ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <IconRefresh className="h-4 w-4 mr-2" />
                    {overview ? "Regenerate" : "Generate"}
                  </>
                )}
              </Button>
              {overview && (
                <Button
                  onClick={downloadOverview}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <IconDownload className="h-4 w-4 mr-2" />
                  Download .md
                </Button>
              )}
            </div>
          </div>

          {overview ? (
            <div className="prose dark:prose-invert max-w-none overflow-y-auto max-h-[600px]">
              <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg font-mono border border-gray-200 dark:border-gray-700">
                {overview}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">
                Click &quot;Generate&quot; to create a study guide overview
              </p>
              <p className="text-xs">
                This will create a formatted Markdown cheatsheet for download
              </p>
            </div>
          )}
        </Card>

        {/* Audio */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Audio Study Podcast
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateAudio}
                disabled={generatingAudio}
                size="sm"
                variant="outline"
              >
                {generatingAudio ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <IconVolume className="mr-2 h-4 w-4" />
                    {audioScript ? "Regenerate" : "Generate"}
                  </>
                )}
              </Button>
              {audioUrl && (
                <Button
                  onClick={downloadAudio}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <IconDownload className="h-4 w-4 mr-2" />
                  Download .mp3
                </Button>
              )}
            </div>
          </div>

          {audioScript ? (
            <div className="space-y-4">
              {/* Audio Player */}
              {audioUrl && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <IconVolume className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Audio Ready to Play
                    </span>
                  </div>
                  <audio controls className="w-full">
                    <source src={audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Script Preview */}
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                    <span className="group-open:rotate-90 transition-transform">
                      ▶
                    </span>
                    <span>View Script</span>
                  </div>
                </summary>
                <div className="mt-2 prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700">
                    {audioScript}
                  </pre>
                </div>
              </details>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">
                Click &quot;Generate&quot; to create an audio podcast
              </p>
              <p className="text-xs">
                1-2 minute sharp, no-fluff study overview with ElevenLabs AI
                voice
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Project Metadata */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Project Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Concepts</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {projectData.graph?.graph_metadata?.total_concepts || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Depth Levels</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {projectData.graph?.graph_metadata?.depth_levels || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Subject</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {projectData.graph?.graph_metadata?.subject || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Created</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {projectData.created_at
                ? new Date(
                    projectData.created_at.seconds * 1000
                  ).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </Card>
      {/* Progress Dashboard Modal */}
      {showProgressDashboard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Learning Progress Dashboard</h2>
                <Button
                  onClick={() => setShowProgressDashboard(false)}
                  variant="ghost"
                  size="sm"
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6">
              <ProgressDashboard
                projectData={projectData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProgressDashboardProps {
  projectData: ProjectData;
}

function ProgressDashboard({ projectData }: ProgressDashboardProps) {
  const nodes = projectData.graph?.nodes || [];
  const totalConcepts = nodes.length;

  // Calculate progress metrics
  const conceptsWithNotes = nodes.filter(node => node.notes && node.notes.trim()).length;
  const conceptsWithConfidence = nodes.filter(node => node.confidence !== null && node.confidence !== undefined).length;
  const averageConfidence = nodes
    .filter(node => node.confidence !== null && node.confidence !== undefined)
    .reduce((sum, node) => sum + (node.confidence || 0), 0) /
    Math.max(conceptsWithConfidence, 1);

  // Group concepts by confidence level
  const confidenceDistribution = [1, 2, 3, 4, 5].map(level =>
    nodes.filter(node => node.confidence === level).length
  );

  // Calculate completion percentage
  const completionPercentage = Math.round(
    ((conceptsWithNotes + conceptsWithConfidence) / (totalConcepts * 2)) * 100
  );

  // Mock time tracking (in a real app, this would come from user sessions)
  const estimatedStudyTime = totalConcepts * 15; // 15 minutes per concept
  const timeSpent = Math.round(Math.random() * estimatedStudyTime * 0.7); // Mock progress

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-cyan-400">{totalConcepts}</div>
          <div className="text-sm text-muted-foreground">Total Concepts</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-400">{completionPercentage}%</div>
          <div className="text-sm text-muted-foreground">Completion</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {averageConfidence ? averageConfidence.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">Avg Confidence</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-400">{Math.round(timeSpent / 60)}h</div>
          <div className="text-sm text-muted-foreground">Time Spent</div>
        </Card>
      </div>

      {/* Progress Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Concept Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Concept Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">With Notes</span>
              <span className="font-medium">{conceptsWithNotes}/{totalConcepts}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full"
                style={{ width: `${(conceptsWithNotes / totalConcepts) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">With Confidence Rating</span>
              <span className="font-medium">{conceptsWithConfidence}/{totalConcepts}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(conceptsWithConfidence / totalConcepts) * 100}%` }}
              ></div>
            </div>
          </div>
        </Card>

        {/* Confidence Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Confidence Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(level => (
              <div key={level} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded ${
                          i < level ? 'bg-yellow-400' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">Level {level}</span>
                </div>
                <span className="font-medium">{confidenceDistribution[level - 1]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Study Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Study Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">Focus Areas</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {nodes
                .filter(node => !node.confidence || node.confidence < 3)
                .slice(0, 3)
                .map(node => (
                  <li key={node.name}>• {node.name}</li>
                ))}
              {nodes.filter(node => !node.confidence || node.confidence < 3).length === 0 && (
                <li>• All concepts have good confidence ratings!</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Next Steps</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Add notes to {Math.max(0, totalConcepts - conceptsWithNotes)} more concepts</li>
              <li>• Rate confidence for {Math.max(0, totalConcepts - conceptsWithConfidence)} concepts</li>
              <li>• Review low-confidence concepts regularly</li>
              <li>• Consider spaced repetition for better retention</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Recent Activity (Mock Data) */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Added notes to concept</div>
              <div className="text-sm text-muted-foreground">2 hours ago</div>
            </div>
            <div className="text-sm text-cyan-400">+1 concept</div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <div className="font-medium text-foreground">Updated confidence rating</div>
              <div className="text-sm text-muted-foreground">1 day ago</div>
            </div>
            <div className="text-sm text-green-400">+1 rating</div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-foreground">Generated study guide</div>
              <div className="text-sm text-muted-foreground">3 days ago</div>
            </div>
            <div className="text-sm text-purple-400">Export</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
