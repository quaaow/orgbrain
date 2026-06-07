export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface Membership {
  organization_id: string;
  role: Role;
  organization?: { id: string; name: string } | null;
}

export interface Me {
  user: { userId: string; email: string | null };
  memberships: Membership[];
}

export interface Organization {
  id: string;
  name: string;
  created_at?: string | null;
}

export type KnowledgeType = 'fact' | 'document' | 'note' | 'policy';

export interface Knowledge {
  id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  importance: number;
  source: string;
  created_by: string | null;
  reviewed_at: string | null;
  review_due_at: string | null;
  stale: boolean;
  created_at: string | null;
}

export interface SearchHit {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

export type DecisionStatus =
  | 'proposed'
  | 'accepted'
  | 'rejected'
  | 'implemented';

export interface Decision {
  id: string;
  title: string;
  description: string | null;
  reason: string;
  outcome: string | null;
  status: DecisionStatus;
  source: string;
  created_at: string | null;
}

export type ExtractionKind = 'fact' | 'decision' | 'lesson';
export type ExtractionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'applied'
  | 'duplicate';

export interface ExtractionItem {
  id: string;
  run_id: string;
  kind: ExtractionKind;
  status: ExtractionStatus;
  payload: Record<string, unknown>;
  confidence: number;
  decision_ref: number | null;
  duplicate_of_id: string | null;
  duplicate_score: number | null;
  materialized_id: string | null;
}

export interface ReflectionRun {
  id: string;
  status: 'pending' | 'applied' | 'partial' | 'discarded';
  input_chars: number;
  chunk_count: number;
  counts: {
    facts: number;
    decisions: number;
    lessons: number;
    duplicates: number;
  } | null;
  created_at: string | null;
}

export interface ReflectResult {
  run: ReflectionRun;
  items: ExtractionItem[];
}

export type GraphNodeType = 'knowledge' | 'decision' | 'lesson';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  subtype: string | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  source_type: GraphNodeType;
  target: string;
  target_type: GraphNodeType;
  relation: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  counts: { nodes: number; edges: number };
}
