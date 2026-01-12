"use client";

import { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import NotesPanel from "./NotesPanel";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  { ssr: false }
);

interface GraphNode {
  id: string;
  name: string;
  val: number;
  group?: string;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface KnowledgeGraphProps {
  graphData?: any;
  projectId?: string;
  onSaveNotes?: (conceptName: string, notes: string) => void;
  onSaveConfidence?: (conceptName: string, confidence: number) => void;
}

// Vibrant palette; we'll hash node ids to distribute colors so every node differs
const VIBRANT_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#FF8E72", "#95E1D3",
  "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA", "#FFB7B2",
  "#8AC6D1", "#FFD166", "#F9C74F", "#43AA8B", "#577590",
  "#C0FDFB", "#FDB9FC", "#C2F970", "#FF9B71", "#7AD7F0",
];

export default function KnowledgeGraph({
  graphData,
  projectId,
  onSaveNotes,
  onSaveConfidence,
}: KnowledgeGraphProps) {
  const fgRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [conceptDefinition, setConceptDefinition] = useState<string>("");
  const [loadingDef, setLoadingDef] = useState(false);
  const [relatedConcepts, setRelatedConcepts] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [graphView, setGraphView] = useState<"network" | "timeline">("network");
  const [animationTick, setAnimationTick] = useState(0);

  useLayoutEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate connection count for each node
  const enrichedData = useMemo(() => {
    if (!graphData) return null;

    // Handle both formats: {nodes, links} and {nodes with ins/outs, graph_metadata}
    let nodes: GraphNode[] = [];
    let links: GraphLink[] = [];

    if (graphData.nodes && Array.isArray(graphData.nodes)) {
      // Check if this is the new format with direct nodes/links
      if (graphData.links && Array.isArray(graphData.links)) {
        nodes = graphData.nodes;
        links = graphData.links;
      } else if (graphData.nodes[0]?.ins !== undefined || graphData.nodes[0]?.outs !== undefined) {
        // This is the old format with ins/outs - convert to nodes/links
        const nodeMap = new Map<string, GraphNode>();
        const linkSet = new Set<string>();

        // First pass: create all nodes
        graphData.nodes.forEach((node: any) => {
          nodeMap.set(node.name, {
            id: node.name,
            name: node.name,
            val: 1,
          });
          
          // Also add referenced nodes
          if (node.ins) {
            node.ins.forEach((inNode: string) => {
              if (!nodeMap.has(inNode)) {
                nodeMap.set(inNode, {
                  id: inNode,
                  name: inNode,
                  val: 1,
                });
              }
            });
          }
          if (node.outs) {
            node.outs.forEach((outNode: string) => {
              if (!nodeMap.has(outNode)) {
                nodeMap.set(outNode, {
                  id: outNode,
                  name: outNode,
                  val: 1,
                });
              }
            });
          }
        });

        nodes = Array.from(nodeMap.values());

        // Second pass: create links
        graphData.nodes.forEach((node: any) => {
          if (node.outs) {
            node.outs.forEach((outNode: string) => {
              const linkId = `${node.name}-${outNode}`;
              if (!linkSet.has(linkId)) {
                linkSet.add(linkId);
                links.push({ source: node.name, target: outNode });
              }
            });
          }
          if (node.ins) {
            node.ins.forEach((inNode: string) => {
              const linkId = `${inNode}-${node.name}`;
              if (!linkSet.has(linkId)) {
                linkSet.add(linkId);
                links.push({ source: inNode, target: node.name });
              }
            });
          }
        });
      } else {
        nodes = graphData.nodes;
      }
    }

    if (nodes.length === 0) return null;

    // Count connections for each node (importance metric)
    const connectionCount = new Map<string, number>();
    links.forEach((link) => {
      const src = typeof link.source === "string" ? link.source : link.source.id;
      const tgt = typeof link.target === "string" ? link.target : link.target.id;
      connectionCount.set(src, (connectionCount.get(src) || 0) + 1);
      connectionCount.set(tgt, (connectionCount.get(tgt) || 0) + 1);
    });

    // Find max connections for normalization
    const maxConnections = Math.max(...Array.from(connectionCount.values()), 1);

    // Node size based on importance (connections)
    // Min size: 25, Max size: 70
    // More connections = larger node
    const enrichedNodes = nodes.map((node) => {
      const connections = connectionCount.get(node.id) || 1;
      const importance = connections / maxConnections; // 0 to 1
      const baseSize = 25;
      const maxSize = 70;
      const size = baseSize + (importance * (maxSize - baseSize));
      
      return {
        ...node,
        val: size,
        connections: connections,
        importance: importance,
      };
    });

    return {
      nodes: enrichedNodes,
      links: links,
    };
  }, [graphData]);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!enrichedData) return null;

    if (!searchQuery.trim()) {
      return enrichedData;
    }

    const query = searchQuery.toLowerCase();
    const matchedIds = new Set<string>();
    const matchedNodes: GraphNode[] = [];

    enrichedData.nodes.forEach((node) => {
      if (node.name.toLowerCase().includes(query)) {
        matchedIds.add(node.id);
        matchedNodes.push(node);
      }
    });

    // Include connected nodes
    const expandedIds = new Set(matchedIds);
    enrichedData.links.forEach((link) => {
      const src = typeof link.source === "string" ? link.source : link.source.id;
      const tgt = typeof link.target === "string" ? link.target : link.target.id;

      if (matchedIds.has(src)) expandedIds.add(tgt);
      if (matchedIds.has(tgt)) expandedIds.add(src);
    });

    return {
      nodes: enrichedData.nodes.filter((n) => expandedIds.has(n.id)),
      links: enrichedData.links.filter((link) => {
        const src = typeof link.source === "string" ? link.source : link.source.id;
        const tgt = typeof link.target === "string" ? link.target : link.target.id;
        return expandedIds.has(src) && expandedIds.has(tgt);
      }),
    };
  }, [enrichedData, searchQuery]);

  // Fetch concept definition (original flow: POST /api/concept-definition)
  const fetchConceptDefinition = useCallback(
    async (nodeId: string) => {
      if (!projectId) return;

      setLoadingDef(true);
      try {
        const response = await fetch(`/api/concept-definition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            concept_name: nodeId,
            project_id: projectId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setConceptDefinition(data.definition || "No definition available");
        } else {
          setConceptDefinition("No definition available.");
        }
      } catch (error) {
        console.error("Error fetching concept definition:", error);
        setConceptDefinition("Error fetching definition");
      } finally {
        setLoadingDef(false);
      }
    },
    [projectId]
  );

  // Hash every node id into the vibrant palette so each node is a different color
  const getNodeColor = (node: GraphNode) => {
    let hash = 0;
    for (let i = 0; i < node.id.length; i++) {
      hash = node.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return VIBRANT_COLORS[Math.abs(hash) % VIBRANT_COLORS.length];
  };

  // Neighbors helper for related concepts
  const getRelatedConcepts = useCallback(
    (nodeId: string) => {
      if (!filteredData) return [] as string[];
      const neighbors = new Set<string>();
      filteredData.links.forEach((link: any) => {
        const src = typeof link.source === "string" ? link.source : link.source.id;
        const tgt = typeof link.target === "string" ? link.target : link.target.id;
        if (src === nodeId) neighbors.add(tgt);
        if (tgt === nodeId) neighbors.add(src);
      });
      return Array.from(neighbors);
    },
    [filteredData]
  );

  // Lookup notes from original graph data if present
  const getCurrentNotes = useCallback(
    (nodeId: string) => {
      if (!graphData?.nodes) return "";
      const match = graphData.nodes.find((n: any) => n.name === nodeId || n.id === nodeId);
      return match?.notes || "";
    },
    [graphData?.nodes]
  );

  // Handle node click
  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    setShowNotes(true);
    setRelatedConcepts(getRelatedConcepts(node.id));
    fetchConceptDefinition(node.id);
  };

  // Configure forces when data changes
  useEffect(() => {
    if (fgRef.current && filteredData?.nodes.length) {
      const fg = fgRef.current as any;
      const nodeCount = filteredData.nodes.length;
      const dynamicDistance = Math.max(150, Math.min(350, nodeCount * 10));
      
      // Configure link distance dynamically based on node count
      fg.d3Force('link')?.distance(() => dynamicDistance);
      
      // Strong repulsion force to spread nodes apart
      fg.d3Force('charge')?.strength(-1000);
      
      // Center force to keep graph centered
      fg.d3Force('center')?.strength(0.05);
    }
  }, [filteredData?.nodes.length]);

  // Smooth animation ticker - updates every 50ms (20fps) for efficiency
  useEffect(() => {
    if (graphView !== "network") return;
    
    const interval = setInterval(() => {
      setAnimationTick(t => t + 1);
    }, 50);
    
    return () => clearInterval(interval);
  }, [graphView]);

  // Initial camera zoom
  useEffect(() => {
    if (fgRef.current && filteredData?.nodes.length) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 100);
      }, 500);
    }
  }, [filteredData?.nodes.length]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <div className="text-purple-300 font-medium">Loading knowledge graph...</div>
        </div>
      </div>
    );
  }

  if (!filteredData || filteredData.nodes.length === 0) {
    return (
      <div className="w-full h-full bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-8">
          <div className="text-6xl">🧠</div>
          <div className="text-purple-300 font-medium text-lg">No graph data available</div>
          <div className="text-purple-400/60 text-sm">Please upload a PDF first to generate your knowledge graph</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      {/* Controls Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* View Selector - Compact */}
        <div className="flex gap-1">
          <button
            onClick={() => setGraphView("network")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
              graphView === "network"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Network
          </button>
          <button
            onClick={() => setGraphView("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
              graphView === "timeline"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Graph Canvas - Full remaining space */}
      {graphView === "network" && (
        <div className="flex-1 relative m-4 rounded-lg overflow-hidden border border-gray-200 shadow-lg">
          <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <ForceGraph2D
              ref={fgRef}
              graphData={filteredData as any}
              nodeColor={(node: any) => getNodeColor(node)}
              nodeVal={(node: any) => node.val}
              nodeCanvasObject={(node: any, ctx: any) => {
                // Guard against invalid coordinates during force simulation
                if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;
                
                const size = node.val || 18;
                const isHovered = hoveredNode?.id === node.id;
                const nodeColor = getNodeColor(node);

                // Create gradient for node
                const gradient = ctx.createRadialGradient(
                  node.x - size * 0.3, 
                  node.y - size * 0.3, 
                  0, 
                  node.x, 
                  node.y, 
                  size
                );
                gradient.addColorStop(0, nodeColor);
                gradient.addColorStop(0.7, nodeColor);
                gradient.addColorStop(1, nodeColor + "80");

                // Draw outer glow (always visible, stronger on hover)
                const glowIntensity = isHovered ? 0.6 : 0.25;
                for (let i = 3; i > 0; i--) {
                  ctx.fillStyle = nodeColor + Math.floor(glowIntensity * 25 / i).toString(16).padStart(2, '0');
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, size + i * 8, 0, 2 * Math.PI);
                  ctx.fill();
                }

                // Draw orbital ring for larger nodes
                  if (size > 25) {
                    ctx.strokeStyle = nodeColor + "40";
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([3, 6]);
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, size + 12, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.setLineDash([]);
                  }

                  // Draw main node circle with gradient
                  ctx.fillStyle = gradient;
                  ctx.shadowColor = nodeColor;
                  ctx.shadowBlur = isHovered ? 25 : 12;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
                  ctx.fill();
                  ctx.shadowBlur = 0;

                  // Draw glossy highlight
                  const highlightGradient = ctx.createRadialGradient(
                    node.x - size * 0.4,
                    node.y - size * 0.4,
                    0,
                    node.x - size * 0.2,
                    node.y - size * 0.2,
                    size * 0.8
                  );
                  highlightGradient.addColorStop(0, "rgba(255,255,255,0.4)");
                  highlightGradient.addColorStop(1, "rgba(255,255,255,0)");
                  ctx.fillStyle = highlightGradient;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
                  ctx.fill();

                  // Draw border
                  ctx.strokeStyle = isHovered ? "#ffffff" : "rgba(255,255,255,0.6)";
                  ctx.lineWidth = isHovered ? 3 : 1.5;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
                  ctx.stroke();

                  // Show label for larger nodes or on hover
                  if (isHovered || size > 30) {
                    const label = node.name.length > 20 ? node.name.substring(0, 18) + "..." : node.name;
                    ctx.font = `bold ${isHovered ? 13 : 11}px 'Inter', system-ui, sans-serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    
                    // Text shadow for readability
                    ctx.fillStyle = "rgba(0,0,0,0.8)";
                    ctx.fillText(label, node.x + 1, node.y + size + 16);
                    
                    // Main text
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(label, node.x, node.y + size + 15);
                  }
                }}
                linkCanvasObject={(link: any, ctx: any) => {
                  const srcNode = typeof link.source === "object" ? link.source : filteredData.nodes.find((n: any) => n.id === link.source);
                  const tgtNode = typeof link.target === "object" ? link.target : filteredData.nodes.find((n: any) => n.id === link.target);
                  
                  // Check for valid nodes and coordinates
                  if (!srcNode || !tgtNode) return;
                  if (!Number.isFinite(srcNode.x) || !Number.isFinite(srcNode.y) || 
                      !Number.isFinite(tgtNode.x) || !Number.isFinite(tgtNode.y)) return;
                  
                  const srcColor = getNodeColor(srcNode);
                  
                  // Create gradient along link
                  const gradient = ctx.createLinearGradient(srcNode.x, srcNode.y, tgtNode.x, tgtNode.y);
                  gradient.addColorStop(0, srcColor + "90");
                  gradient.addColorStop(0.5, srcColor + "50");
                  gradient.addColorStop(1, srcColor + "20");
                  
                  // Draw curved link
                  const midX = (srcNode.x + tgtNode.x) / 2;
                  const midY = (srcNode.y + tgtNode.y) / 2;
                  const dx = tgtNode.x - srcNode.x;
                  const dy = tgtNode.y - srcNode.y;
                  const curvature = 0.15;
                  const ctrlX = midX - dy * curvature;
                  const ctrlY = midY + dx * curvature;
                  
                  ctx.strokeStyle = gradient;
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.moveTo(srcNode.x, srcNode.y);
                  ctx.quadraticCurveTo(ctrlX, ctrlY, tgtNode.x, tgtNode.y);
                  ctx.stroke();
                  
                  // Draw multiple animated particles along link using animationTick
                  const linkId = `${srcNode.id}-${tgtNode.id}`;
                  const linkHash = linkId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                  const particleOffset = (linkHash % 100) / 100; // Unique offset per link
                  
                  // Draw 2 particles per link at different phases
                  for (let p = 0; p < 2; p++) {
                    const t = ((animationTick * 0.02 + particleOffset + p * 0.5) % 1);
                    const particleX = Math.pow(1-t, 2) * srcNode.x + 2 * (1-t) * t * ctrlX + Math.pow(t, 2) * tgtNode.x;
                    const particleY = Math.pow(1-t, 2) * srcNode.y + 2 * (1-t) * t * ctrlY + Math.pow(t, 2) * tgtNode.y;
                    
                    ctx.fillStyle = srcColor;
                    ctx.shadowColor = srcColor;
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, 2.5, 0, 2 * Math.PI);
                    ctx.fill();
                  }
                  ctx.shadowBlur = 0;
                }}
                linkColor={() => "transparent"}
                linkWidth={0}
                onNodeHover={(node: any) => setHoveredNode(node)}
                onNodeClick={(node: any) => handleNodeClick(node)}
                backgroundColor="transparent"
                enableNodeDrag={true}
                enableZoomInteraction={true}
                cooldownTicks={100}
                warmupTicks={30}
                d3VelocityDecay={0.25}
                linkDirectionalParticles={0}
                d3AlphaDecay={0.02}
                dagMode={undefined}
                onEngineStop={() => fgRef.current?.zoomToFit(400, 80)}
                nodeRelSize={8}
                onEngineTick={() => {
                  // Dynamically adjust forces based on node count
                  if (fgRef.current) {
                    const fg = fgRef.current as any;
                    const nodeCount = filteredData?.nodes?.length || 1;
                    const dynamicDistance = Math.max(120, Math.min(300, nodeCount * 8));
                    
                    // Increase link distance dynamically
                    fg.d3Force('link')?.distance(() => dynamicDistance);
                    
                    // Stronger charge repulsion to spread nodes
                    fg.d3Force('charge')?.strength(-800);
                    
                    // Add collision force based on node size
                    fg.d3Force('collision', 
                      (window as any).d3?.forceCollide?.()
                        ?.radius((node: any) => (node.val || 18) + 25)
                        ?.strength(0.9)
                    );
                  }
                }}
              />
            </div>
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-purple-400/50 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-purple-400/50 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-purple-400/50 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-purple-400/50 rounded-br-lg pointer-events-none" />
          </div>
        )}

        {/* Timeline View - Light theme */}
        {graphView === "timeline" && (
          <div className="flex-1 m-4 bg-white rounded-lg border border-gray-200 shadow-lg overflow-auto p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Concept Timeline
            </h3>
            <div className="space-y-2">
              {filteredData.nodes.map((node, idx) => (
                <div
                  key={`timeline-${node.id}-${idx}`}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all duration-300"
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 shadow"
                        style={{ backgroundColor: getNodeColor(node) }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{node.name}</h4>
                        <p className="text-xs text-gray-500">
                          {(node as any).connections || 1} connections • {Math.round(((node as any).importance || 0) * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-purple-600 text-xs font-medium">
                      →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hover Info - Fixed bottom, light theme */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-900 bg-white/95 px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-3 backdrop-blur-sm shadow-xl z-50">
            <div className="w-4 h-4 rounded-full shadow" style={{ backgroundColor: getNodeColor(hoveredNode) }} />
            <span className="font-semibold">{hoveredNode.name}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-600">{(hoveredNode as any).connections || 1} connections</span>
            <span className="text-gray-300">•</span>
            <span className="text-purple-600 font-medium">{Math.round(((hoveredNode as any).importance || 0) * 100)}%</span>
          </div>
        )}

      {/* Sidebar Panels: Notes as Modal Popup */}
      {showNotes && selectedNode && (
        <NotesPanel
          isOpen={true}
          onClose={() => setShowNotes(false)}
          conceptName={selectedNode.name}
          currentNotes={getCurrentNotes(selectedNode.id)}
          onSaveNotes={onSaveNotes || (() => {})}
          conceptDefinition={conceptDefinition}
          loadingDefinition={loadingDef}
        />
      )}
    </div>
  );
}

