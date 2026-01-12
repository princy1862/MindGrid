"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";

interface TreeNode {
  id: string;
  name: string;
  val: number;
}

interface TreeLink {
  source: string;
  target: string;
}

interface RadialTreeViewProps {
  nodes: TreeNode[];
  links: TreeLink[];
  onNodeClick?: (node: TreeNode) => void;
  onNodeHover?: (node: TreeNode | null) => void;
  nodeColor?: (node: TreeNode) => string;
}

interface PositionedNode extends TreeNode {
  x: number;
  y: number;
  depth: number;
}

export default function RadialTreeView({
  nodes,
  links,
  onNodeClick,
  onNodeHover,
  nodeColor,
}: RadialTreeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Calculate hierarchical tree positions
  const positionedNodes = useMemo(() => {
    if (nodes.length === 0) return [];

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    // Build adjacency
    const childMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();
    
    links.forEach((link) => {
      const src = typeof link.source === "string" ? link.source : (link.source as any).id;
      const tgt = typeof link.target === "string" ? link.target : (link.target as any).id;
      if (!childMap.has(src)) childMap.set(src, []);
      childMap.get(src)!.push(tgt);
      parentMap.set(tgt, src);
    });

    // Find root (node with no parent)
    const root = nodes.find((n) => !parentMap.has(n.id)) || nodes[0];

    // Calculate depth via BFS
    const depthMap = new Map<string, number>();
    const queue: string[] = [root.id];
    depthMap.set(root.id, 0);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const children = childMap.get(curr) || [];
      children.forEach((child) => {
        if (!depthMap.has(child)) {
          depthMap.set(child, (depthMap.get(curr) || 0) + 1);
          queue.push(child);
        }
      });
    }

    const maxDepth = Math.max(...Array.from(depthMap.values()), 0);

    // Group nodes by depth
    const nodesByDepth = new Map<number, string[]>();
    nodes.forEach((node) => {
      const depth = depthMap.get(node.id) || 0;
      if (!nodesByDepth.has(depth)) nodesByDepth.set(depth, []);
      nodesByDepth.get(depth)!.push(node.id);
    });

    // Calculate positions - top-down hierarchy
    const padding = 60;
    const nodeRadius = 18;
    const verticalGap = Math.max(100, (height - 2 * padding) / (maxDepth + 1));
    const horizontalGap = Math.max(60, (width - 2 * padding) / 10);

    return nodes.map((node) => {
      const depth = depthMap.get(node.id) || 0;
      const y = padding + depth * verticalGap;

      // Get siblings at same depth
      const siblings = nodesByDepth.get(depth) || [];
      const index = siblings.indexOf(node.id);
      const totalAtDepth = siblings.length;

      // Center horizontally
      const totalWidth = totalAtDepth * horizontalGap;
      const startX = (width - totalWidth) / 2 + nodeRadius;
      const x = startX + index * horizontalGap;

      return {
        ...node,
        x: Math.max(nodeRadius + 10, Math.min(width - nodeRadius - 10, x)),
        y,
        depth,
      };
    });
  }, [nodes, links]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    canvas.width = width;
    canvas.height = height;

    // Clear
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw links
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    links.forEach((link) => {
      const src = typeof link.source === "string" ? link.source : (link.source as any).id;
      const tgt = typeof link.target === "string" ? link.target : (link.target as any).id;
      const srcNode = positionedNodes.find((n) => n.id === src);
      const tgtNode = positionedNodes.find((n) => n.id === tgt);

      if (srcNode && tgtNode) {
        ctx.beginPath();
        ctx.moveTo(srcNode.x, srcNode.y);
        ctx.lineTo(tgtNode.x, tgtNode.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    positionedNodes.forEach((node) => {
      const radius = 15;
      const isHovered = hoveredNodeId === node.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor ? nodeColor(node) : "#9333ea";
      ctx.fill();

      // Border - thicker if hovered
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = isHovered ? 4 : 2.5;
      ctx.stroke();

      // Hover glow
      if (isHovered) {
        ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Node label
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Truncate text if too long
      let label = node.name;
      if (label.length > 12) {
        label = label.substring(0, 10) + "...";
      }
      
      ctx.fillText(label, node.x, node.y);
    });
  }, [positionedNodes, links, nodeColor, hoveredNodeId]);

  // Interactions
  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let hoveredNode: PositionedNode | null = null;
      for (const node of positionedNodes) {
        const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
        if (dist <= 15 + 5) {
          hoveredNode = node;
          break;
        }
      }

      canvas.style.cursor = hoveredNode ? "pointer" : "default";
      setHoveredNodeId(hoveredNode?.id || null);
      onNodeHover?.(hoveredNode || null);
    },
    [positionedNodes, onNodeHover]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const node of positionedNodes) {
        const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
        if (dist <= 15 + 5) {
          onNodeClick?.(node);
          break;
        }
      }
    },
    [positionedNodes, onNodeClick]
  );

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-default"
        onMouseMove={handleMove}
        onClick={handleClick}
        onMouseLeave={() => {
          setHoveredNodeId(null);
          onNodeHover?.(null);
        }}
      />
      
      {/* Hover tooltip */}
      {hoveredNodeId && (
        <div className="absolute bottom-4 left-4 bg-gray-900 text-white px-3 py-2 rounded text-sm font-medium pointer-events-none">
          {positionedNodes.find((n) => n.id === hoveredNodeId)?.name}
        </div>
      )}
    </div>
  );
}

