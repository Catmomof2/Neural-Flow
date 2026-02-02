
export enum NodeType {
  CONCEPT = 'CONCEPT',
  ACTION = 'ACTION',
  OUTCOME = 'OUTCOME',
  PROBLEM = 'PROBLEM',
  SOLUTION = 'SOLUTION'
}

export interface Node {
  id: string;
  label: string;
  description: string;
  type: NodeType;
  x: number;
  y: number;
}

export interface Group {
  id: string;
  label: string;
  nodeIds: string[];
  isCollapsed: boolean;
  color: string;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
  groups: Group[];
  title: string;
  summary: string;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  timestamp: number;
  data: FlowData;
}

export enum LeadType {
  SIGNUP = 'SIGNUP',
  CONTACT = 'CONTACT'
}

export enum LeadStatus {
  NEW = 'NEW',
  PROCESSED = 'PROCESSED'
}

export interface Lead {
  id: string;
  email: string;
  type: LeadType;
  message?: string;
  timestamp: number;
  status: LeadStatus;
  referralCode: string;
  referredBy?: string; // The code of the person who referred them
  referralCount: number; // How many people they have referred
}

export type AppView = 'CANVAS' | 'WAITLIST' | 'ADMIN';
