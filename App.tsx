
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateFlow } from './services/geminiService';
import { FlowData, HistoryItem, Lead, LeadType, LeadStatus, Node, AppView, Edge, Group } from './types';
import Canvas from './components/Canvas';
import AdminDashboard from './components/AdminDashboard';
import { NewsletterSignup, ContactModal } from './components/LeadForms';
import WaitlistPage from './components/WaitlistPage';
import { sendNotification } from './services/notificationService';

const GROUP_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b'];

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<FlowData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [multiSelectNodeIds, setMultiSelectNodeIds] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<FlowData[]>([]);
  const [redoStack, setRedoStack] = useState<FlowData[]>([]);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const savedLead = localStorage.getItem('neuralflow_my_lead');
    return savedLead ? 'CANVAS' : 'WAITLIST';
  });

  // State for Leads and Admin
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('neuralflow_leads');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [myLead, setMyLead] = useState<Lead | null>(() => {
    const saved = localStorage.getItem('neuralflow_my_lead');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('neuralflow_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    if (myLead) {
      localStorage.setItem('neuralflow_my_lead', JSON.stringify(myLead));
    }
  }, [myLead]);

  // Handle new lead submissions (waitlist or contact)
  const handleNewLead = (newLead: Lead) => {
    setLeads(prev => {
      const next = [...prev, newLead];
      // Update referral count if referred by someone
      if (newLead.referredBy) {
        return next.map(l => 
          l.referralCode === newLead.referredBy 
            ? { ...l, referralCount: l.referralCount + 1 } 
            : l
        );
      }
      return next;
    });

    if (newLead.type === LeadType.SIGNUP) {
      setMyLead(newLead);
    }

    if (newLead.type === LeadType.CONTACT) {
      sendNotification('OWNER_ALERT', newLead);
    }
  };

  const selectedNode = currentFlow?.nodes.find(n => n.id === selectedNodeId);
  const selectedEdge = currentFlow?.edges.find(e => e.id === selectedEdgeId);
  const selectedGroup = currentFlow?.groups.find(g => selectedGroupIds.includes(g.id));

  const filteredHistory = history.filter(item => 
    item.prompt.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  const recordState = useCallback(() => {
    if (currentFlow) {
      setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(currentFlow))]);
      setRedoStack([]);
    }
  }, [currentFlow]);

  const handleUndo = () => {
    if (undoStack.length === 0 || !currentFlow) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(currentFlow))]);
    setUndoStack(prev => prev.slice(0, -1));
    setCurrentFlow(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !currentFlow) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(currentFlow))]);
    setRedoStack(prev => prev.slice(0, -1));
    setCurrentFlow(next);
  };

  // Node Multi-select logic
  const handleNodeSelect = (id: string | null, isMulti: boolean) => {
    if (id === null) {
      setSelectedNodeId(null);
      setMultiSelectNodeIds([]);
      setSelectedGroupIds([]);
      return;
    }

    if (isMulti) {
      setMultiSelectNodeIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(id);
      setMultiSelectNodeIds([]);
    }
    setSelectedEdgeId(null);
    setSelectedGroupIds([]);
  };

  const handleGroupSelect = (id: string) => {
    setSelectedGroupIds([id]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setMultiSelectNodeIds([]);
  };

  const handleCreateGroup = () => {
    if (multiSelectNodeIds.length < 2 || !currentFlow) return;
    recordState();
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      label: 'New Cluster',
      nodeIds: [...multiSelectNodeIds],
      isCollapsed: false,
      color: GROUP_COLORS[currentFlow.groups.length % GROUP_COLORS.length]
    };
    setCurrentFlow({
      ...currentFlow,
      groups: [...currentFlow.groups, newGroup]
    });
    setMultiSelectNodeIds([]);
    setSelectedGroupIds([newGroup.id]);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    if (!currentFlow) return;
    recordState();
    setCurrentFlow({
      ...currentFlow,
      groups: currentFlow.groups.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    });
  };

  const handleDeleteGroup = (id: string) => {
    if (!currentFlow) return;
    recordState();
    setCurrentFlow({
      ...currentFlow,
      groups: currentFlow.groups.filter(g => g.id !== id)
    });
    setSelectedGroupIds([]);
  };

  const handleUpdateNode = (updatedNode: Node) => {
    if (!currentFlow) return;
    recordState();
    setCurrentFlow({
      ...currentFlow,
      nodes: currentFlow.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
    });
  };

  const handleUpdateEdge = (updatedEdge: Edge) => {
    if (!currentFlow) return;
    recordState();
    setCurrentFlow({
      ...currentFlow,
      edges: currentFlow.edges.map(e => e.id === updatedEdge.id ? updatedEdge : e)
    });
  };

  const handleNodeMove = (id: string, x: number, y: number) => {
    if (!currentFlow) return;
    setCurrentFlow({
      ...currentFlow,
      nodes: currentFlow.nodes.map(n => n.id === id ? { ...n, x, y } : n)
    });
  };

  const handleAddEdge = (fromId: string, toId: string) => {
    if (!currentFlow) return;
    recordState();
    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      from: fromId,
      to: toId,
      label: 'New Connection'
    };
    setCurrentFlow({
      ...currentFlow,
      edges: [...currentFlow.edges, newEdge]
    });
    setSelectedEdgeId(newEdge.id);
  };

  const handleDeleteNode = () => {
    if (!currentFlow || !selectedNodeId) return;
    recordState();
    setCurrentFlow({
      ...currentFlow,
      nodes: currentFlow.nodes.filter(n => n.id !== selectedNodeId),
      edges: currentFlow.edges.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId),
      groups: currentFlow.groups.map(g => ({ ...g, nodeIds: g.nodeIds.filter(nid => nid !== selectedNodeId) }))
    });
    setSelectedNodeId(null);
  };

  const handleDeleteEdge = () => {
    if (!currentFlow || !selectedEdgeId) return;
    recordState();
    setCurrentFlow({
      ...currentFlow,
      edges: currentFlow.edges.filter(e => e.id !== selectedEdgeId)
    });
    setSelectedEdgeId(null);
  };

  const handleGenerate = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const data = await generateFlow(finalPrompt);
      if (currentFlow) recordState();
      setCurrentFlow(data);
      setHistory(prev => [{
        id: Date.now().toString(),
        prompt: finalPrompt,
        timestamp: Date.now(),
        data
      }, ...prev.slice(0, 9)]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setMultiSelectNodeIds([]);
      setSelectedGroupIds([]);
    } catch (error) {
      console.error("Failed to generate flow:", error);
      alert("Something went wrong while generating the flow.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    if (currentFlow) recordState();
    setCurrentFlow(item.data);
    setPrompt(item.prompt);
    setShowHistory(false);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSelectedGroupIds([]);
    setMultiSelectNodeIds([]);
  };

  const exportNodeAsJSON = () => {
    if (!selectedNode) return;
    const dataStr = JSON.stringify(selectedNode, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `node-${selectedNode.label.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (currentView === 'WAITLIST') {
    return (
      <WaitlistPage 
        onJoin={handleNewLead} 
        existingLead={myLead || undefined} 
        onEnterApp={() => setCurrentView('CANVAS')}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 animate-in fade-in duration-500">
      {isAdminOpen && (
        <AdminDashboard 
          leads={leads} 
          onClose={() => setIsAdminOpen(false)} 
          onUpdateLeads={setLeads}
        />
      )}

      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
        onNewLead={handleNewLead} 
      />

      {showHistory && (
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col animate-in slide-in-from-left duration-300">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Past Flows</h2>
            <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="px-4 py-3 border-b border-slate-800">
            <input 
              type="text" 
              placeholder="Search history..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-200"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-3">
            {filteredHistory.map(item => (
              <div 
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all"
              >
                <p className="text-sm font-medium line-clamp-2">{item.prompt}</p>
                <p className="text-[10px] text-slate-500 mt-2">{new Date(item.timestamp).toLocaleString()}</p>
              </div>
            ))}
            <NewsletterSignup onNewLead={handleNewLead} />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-16 bg-slate-950/50 backdrop-blur-sm flex items-center px-8 z-30 justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView('WAITLIST')} className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">N</button>
              <span className="font-bold text-xl tracking-tight">NeuralFlow <span className="text-indigo-500">AI</span></span>
            </div>
            <div className="flex gap-4">
               <button onClick={handleUndo} disabled={undoStack.length === 0} className="text-[10px] text-slate-500 hover:text-white disabled:opacity-30">Undo</button>
               <button onClick={handleRedo} disabled={redoStack.length === 0} className="text-[10px] text-slate-500 hover:text-white disabled:opacity-30">Redo</button>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="max-w-xl flex-1 mx-8 flex gap-2">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a topic..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-full px-6 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
            />
            <button type="submit" disabled={isLoading} className="bg-indigo-600 px-6 py-2 rounded-full text-sm font-medium">
              {isLoading ? '...' : 'Generate'}
            </button>
          </form>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsContactOpen(true)} className="text-sm font-medium text-slate-400 hover:text-white">Contact</button>
            <button onClick={() => setShowHistory(!showHistory)} className="p-2 text-slate-400 hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        <Canvas 
          data={currentFlow} 
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          selectedGroupIds={selectedGroupIds}
          multiSelectNodeIds={multiSelectNodeIds}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={(id) => { setSelectedEdgeId(id); setSelectedNodeId(null); setSelectedGroupIds([]); setMultiSelectNodeIds([]); }}
          onGroupSelect={handleGroupSelect}
          onNodeMove={handleNodeMove}
          onNodeMoveStart={recordState}
          onAddEdge={handleAddEdge}
          onUpdateGroup={handleUpdateGroup}
        />

        {/* Multi-select bar */}
        {multiSelectNodeIds.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-indigo-600 rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom duration-300 z-50">
            <span className="text-sm font-bold">{multiSelectNodeIds.length} Nodes Selected</span>
            <button 
              onClick={handleCreateGroup}
              className="bg-white text-indigo-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors"
            >
              Group Nodes
            </button>
          </div>
        )}

        {/* Inspector Panel */}
        {(selectedNode || selectedEdge || selectedGroup) && (
          <div className="absolute top-20 right-8 bottom-8 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 z-40 overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">
                {selectedNode ? selectedNode.type : selectedGroup ? 'GROUP' : 'EDGE'}
              </span>
              <button onClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); setSelectedGroupIds([]); }} className="text-slate-500 hover:text-white">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6 flex-1">
              {selectedNode && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Label</label>
                    <input type="text" value={selectedNode.label} onChange={(e) => handleUpdateNode({ ...selectedNode, label: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                    <textarea rows={6} value={selectedNode.description} onChange={(e) => handleUpdateNode({ ...selectedNode, description: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 leading-relaxed resize-none" />
                  </div>
                </>
              )}

              {selectedGroup && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Group Title</label>
                    <input type="text" value={selectedGroup.label} onChange={(e) => handleUpdateGroup({ ...selectedGroup, label: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold" />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateGroup({ ...selectedGroup, isCollapsed: !selectedGroup.isCollapsed })}
                      className="flex-1 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      {selectedGroup.isCollapsed ? 'Expand Group' : 'Collapse Group'}
                    </button>
                  </div>
                </>
              )}

              {selectedEdge && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Relation</label>
                  <input type="text" value={selectedEdge.label || ''} onChange={(e) => handleUpdateEdge({ ...selectedEdge, label: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold" placeholder="Edge label..." />
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col gap-3">
              {selectedNode && (
                <button onClick={handleDeleteNode} className="w-full py-2.5 bg-rose-600/10 text-rose-500 border border-rose-600/20 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white transition-all">Delete Node</button>
              )}
              {selectedGroup && (
                <button onClick={() => handleDeleteGroup(selectedGroup.id)} className="w-full py-2.5 bg-rose-600/10 text-rose-500 border border-rose-600/20 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white transition-all">Dissolve Group</button>
              )}
              {selectedEdge && (
                <button onClick={handleDeleteEdge} className="w-full py-2.5 bg-rose-600/10 text-rose-500 border border-rose-600/20 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white transition-all">Delete Connection</button>
              )}
            </div>
          </div>
        )}

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-full text-[10px] text-slate-500 font-mono tracking-widest uppercase flex gap-6 z-20">
          <span>Nodes: {currentFlow?.nodes.length || 0}</span>
          <span>Groups: {currentFlow?.groups.length || 0}</span>
        </div>
      </main>
    </div>
  );
};

export default App;
