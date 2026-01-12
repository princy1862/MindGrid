export interface GraphMetadata {
  title: string;
  subject: string;
  total_concepts: number;
  depth_levels: number;
}

export interface GraphData {
  nodes: Array<{
    name: string;
    ins: string[];
    outs: string[];
    notes?: string;
    confidence?: number | null;
  }>;
  graph_metadata: GraphMetadata;
}

export interface ProjectData {
  graph: GraphData;
  digest?: Record<string, unknown>;
  reference: Record<string, unknown>;
  created_at: {
    seconds: number;
  };
}
