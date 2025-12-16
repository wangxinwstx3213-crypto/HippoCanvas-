import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Node, Connection, Position, NodeType, Annotation, Layer, SystemSettings } from './types';
import { NodeComponent } from './components/NodeComponent';
import { ConnectionLine } from './components/ConnectionLine';
import { generateImageWithGemini } from './services/geminiService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { UserInfo } from './components/auth/UserInfo';
import { APIKeyConfig } from './components/auth/APIKeyConfig';
import { NODE_WIDTH_UPLOAD, NODE_WIDTH_GEN } from './constants';
import { Plus, MousePointer2, Image as ImageIcon, Sparkles, Zap, Github, Info, Download, Edit2, Check, X, HelpCircle, ChevronDown, Plug2, Sun, Moon, ZoomIn, ZoomOut, LogIn } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null); // New: Track selected connection
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Default system settings
  const systemSettings: SystemSettings = {
    baseUrl: 'https://api.vectorengine.ai',
    modelName: 'gemini-2.5-flash-image-preview'
  };

  // Help Panel State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isEditingHelp, setIsEditingHelp] = useState(false);
  const [helpContent, setHelpContent] = useState(`使用说明：
- 拖拽【图片节点】右侧的悬空插头。
- 将插头插入【生成器节点】左侧的插座孔。
- 连线点亮表示连接成功。
- 点击连线可选中，按 Delete 键断开连接。
- 在图片上添加标注，并在生成器图层中引用。`);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // API Key Config State
  const [isAPIKeyConfigOpen, setIsAPIKeyConfigOpen] = useState(false);

  // Global counter for node numbering (e.g., Image 1, Image 2)
  const nodeCounter = useRef(1);
  const rAFRef = useRef<number>(); // Ref for requestAnimationFrame

  // Check if user has configured API key
  useEffect(() => {
    if (user && !loading) {
      checkUserAPIKey(user.id);
    }
  }, [user, loading]);

  const checkUserAPIKey = async (userId: string) => {
    try {
      const { userApiService } = await import('./services/userApiService');
      const hasKey = await userApiService.getVectorEngineKey(userId);

      // If user doesn't have API key configured, show config modal
      if (!hasKey) {
        setTimeout(() => {
          setIsAPIKeyConfigOpen(true);
        }, 1000); // Wait 1 second after login to show config
      }
    } catch (error) {
      console.error('检查用户API密钥失败:', error);
    }
  };
  
  // Interaction State
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    mode: 'NODE' | 'CANVAS' | 'CONNECTION' | 'IDLE';
    startPos: Position; // Mouse start position
    nodeStartPos?: Position; // Node start position (if dragging node)
    draggedNodeId?: string;
    connectionStartNodeId?: string;
    connectionCurrentPos?: Position; // For drawing the temp line
  }>({
    isDragging: false,
    mode: 'IDLE',
    startPos: { x: 0, y: 0 },
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('lovart_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('lovart_theme', newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  
  // Global Keydown Listener for Deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
          setSelectedNodeId(null);
        }
        if (selectedConnectionId) {
          deleteConnection(selectedConnectionId);
          setSelectedConnectionId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedConnectionId]);

  
  // Helper: Screen to World coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - offset.x) / scale,
      y: (screenY - rect.top - offset.y) / scale,
    };
  }, [offset, scale]);

  // Add Node
  const addNode = (type: NodeType) => {
    const id = crypto.randomUUID();
    // Center of current view
    const rect = canvasRef.current?.getBoundingClientRect();
    const centerX = rect ? (rect.width / 2 - offset.x) / scale : 100;
    const centerY = rect ? (rect.height / 2 - offset.y) / scale : 100;

    const currentId = nodeCounter.current;
    nodeCounter.current += 1;

    // Default Layer for generator
    const defaultLayers: Layer[] = type === 'GENERATE_IMAGE' ? [{
      id: crypto.randomUUID(),
      name: '基础图层',
      prompt: '',
      isEnabled: true
    }] : [];

    const newNode: Node = {
      id,
      type,
      position: { 
        x: centerX - (type === 'IMAGE_UPLOAD' ? NODE_WIDTH_UPLOAD : NODE_WIDTH_GEN) / 2, 
        y: centerY - 150 
      },
      width: type === 'IMAGE_UPLOAD' ? NODE_WIDTH_UPLOAD : NODE_WIDTH_GEN,
      height: 200, // min height
      data: {
        title: type === 'IMAGE_UPLOAD' ? '输入图片' : 'AI 生成器',
        displayId: currentId,
        model: type === 'GENERATE_IMAGE' ? 'gemini-2.5-flash-image-preview' : undefined,
        aspectRatio: '1:1',
        imageResolution: '1K',
        numberOfImages: 1,
        annotations: [],
        layers: defaultLayers,
        prompt: '', // Legacy/Fallback
      },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  // Node Actions
  const updateNodeData = (nodeId: string, data: Partial<Node['data']>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setConnections((prev) => prev.filter((c) => c.sourceId !== nodeId && c.targetId !== nodeId));
  };

  const deleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  };
  
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null); // Deselect connection when selecting a node
  };

  const handleConnectionSelect = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setSelectedNodeId(null); // Deselect node when selecting a connection
  };

  // Handle Label Click (Insert [图x] into prompt)
  const handleLabelClick = (clickedNodeId: string) => {
    // Check if a GENERATOR node is currently selected
    if (!selectedNodeId) return;

    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (!selectedNode || selectedNode.type !== 'GENERATE_IMAGE') return;

    // Get the display ID of the clicked node
    const clickedNode = nodes.find(n => n.id === clickedNodeId);
    if (!clickedNode) return;

    const labelText = `[图${clickedNode.data.displayId}]`;
    
    // Logic to insert into the last enabled layer or the first layer
    const layers = selectedNode.data.layers || [];
    if (layers.length === 0) return;

    // Prefer the last enabled layer to append text
    let targetLayerIndex = layers.length - 1;
    // Or find last enabled
    for (let i = layers.length - 1; i >= 0; i--) {
       if (layers[i].isEnabled) {
          targetLayerIndex = i;
          break;
       }
    }

    const updatedLayers = [...layers];
    updatedLayers[targetLayerIndex] = {
       ...updatedLayers[targetLayerIndex],
       prompt: updatedLayers[targetLayerIndex].prompt + labelText
    };

    updateNodeData(selectedNodeId, {
      layers: updatedLayers
    });
  };

  const handleAnnotationClick = (nodeId: string, annotationId: number) => {
    if (!selectedNodeId) return;
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (!selectedNode || selectedNode.type !== 'GENERATE_IMAGE') return;
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode) return;
    const labelText = `[图${sourceNode.data.displayId} 标${annotationId}]`;
    const layers = selectedNode.data.layers || [];
    if (layers.length === 0) return;
    let targetLayerIndex = layers.length - 1;
    for (let i = layers.length - 1; i >= 0; i--) {
       if (layers[i].isEnabled) {
          targetLayerIndex = i;
          break;
       }
    }
    const updatedLayers = [...layers];
    updatedLayers[targetLayerIndex] = {
       ...updatedLayers[targetLayerIndex],
       prompt: updatedLayers[targetLayerIndex].prompt + labelText
    };
    updateNodeData(selectedNodeId, { layers: updatedLayers });
  };

  // Helper to draw annotations on an image
  const bakeAnnotationsToImage = async (base64Image: string, annotations: Annotation[]): Promise<string> => {
     return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
           const canvas = document.createElement('canvas');
           canvas.width = img.width;
           canvas.height = img.height;
           const ctx = canvas.getContext('2d');
           if (!ctx) {
              reject(new Error("Could not get canvas context"));
              return;
           }
           ctx.drawImage(img, 0, 0);
           if (annotations.length > 0) {
              const scaleFactor = Math.min(img.width, img.height) / 500; 
              const radius = 15 * scaleFactor;
              const fontSize = 14 * scaleFactor;
              annotations.forEach(ann => {
                 const x = (ann.x / 100) * img.width;
                 const y = (ann.y / 100) * img.height;
                 ctx.beginPath();
                 ctx.arc(x, y, radius, 0, 2 * Math.PI);
                 ctx.fillStyle = '#ef4444'; 
                 ctx.fill();
                 ctx.strokeStyle = '#ffffff';
                 ctx.lineWidth = 2 * scaleFactor;
                 ctx.stroke();
                 ctx.fillStyle = '#ffffff';
                 ctx.font = `bold ${fontSize}px Arial`;
                 ctx.textAlign = 'center';
                 ctx.textBaseline = 'middle';
                 ctx.fillText(ann.id.toString(), x, y);
              });
           }
           resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = base64Image;
     });
  };

  // Generation Logic
  const handleTriggerGeneration = async (nodeId: string) => {
    if ((window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const layers = targetNode.data.layers || [];
    const activeLayers = layers.filter(l => l.isEnabled && l.prompt.trim() !== '');
    
    if (activeLayers.length === 0 && !targetNode.data.prompt) return;

    let compiledPrompt = '';
    if (activeLayers.length > 0) {
       compiledPrompt = activeLayers.map(l => l.prompt).join('\n');
    } else {
       compiledPrompt = targetNode.data.prompt || '';
    }

    const incomingConnections = connections.filter((c) => c.targetId === nodeId);
    const sourceNodes = incomingConnections
      .map(conn => nodes.find(n => n.id === conn.sourceId))
      .filter(n => n !== undefined) as Node[];
    sourceNodes.sort((a, b) => a.data.displayId - b.data.displayId);

    updateNodeData(nodeId, { status: 'loading', generatedImage: undefined, generatedImages: undefined });

    try {
      const referenceImages: string[] = [];
      const idMappingDescription: string[] = [];

      for (let i = 0; i < sourceNodes.length; i++) {
         const node = sourceNodes[i];
         let imageData: string | undefined;

         if (node.type === 'IMAGE_UPLOAD' && node.data.imageUrl) {
            imageData = node.data.imageUrl;
         } else if (node.type === 'GENERATE_IMAGE' && node.data.generatedImage) {
            // Note: If previous node generated multiple images, we use the selected one
            imageData = node.data.generatedImage;
         }

         if (imageData) {
            if (node.data.annotations && node.data.annotations.length > 0) {
               imageData = await bakeAnnotationsToImage(imageData, node.data.annotations);
               idMappingDescription.push(`第 ${i + 1} 张图片对应 [图${node.data.displayId}] (图片上带有红色数字标记)`);
            } else {
               idMappingDescription.push(`第 ${i + 1} 张图片对应 [图${node.data.displayId}]`);
            }
            referenceImages.push(imageData);
         }
      }

      let finalPrompt = compiledPrompt;
      if (idMappingDescription.length > 0) {
        finalPrompt = `${compiledPrompt}\n\n(图片引用说明: ${idMappingDescription.join(', ')}。请根据此对应关系及图片上的数字标记处理提示词。)`;
      }
      
      const requestedCount = targetNode.data.numberOfImages || 1;

      // 确保用户已登录
      if (!user) {
        throw new Error("用户未登录，无法生成图像。请先登录。");
      }

      const resultImages = await generateImageWithGemini(
        {
          prompt: finalPrompt,
          referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
          aspectRatio: targetNode.data.aspectRatio,
          imageResolution: targetNode.data.imageResolution,
          numberOfImages: requestedCount,
        },
        {
          ...systemSettings,
          modelName: targetNode.data.model || systemSettings.modelName
        },
        user.id // 传递用户ID
      );

      updateNodeData(nodeId, { 
        status: 'success', 
        generatedImages: resultImages,
        generatedImage: resultImages[0], // Default to the first one
        selectedImageIndex: 0
      });
    } catch (error: any) {
      console.error(error);
      updateNodeData(nodeId, { status: 'error' });
      alert(`生成图片失败: ${error.message} \n请检查是否选择了正确的项目 (API Key)。`);
    }
  };

  // Zoom Handlers
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.1));
  const handleResetZoom = () => setScale(1);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { 
      setDragState({
        isDragging: true,
        mode: 'CANVAS',
        startPos: { x: e.clientX, y: e.clientY },
      });
      setSelectedNodeId(null);
      setSelectedConnectionId(null); // Deselect everything on canvas click
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    handleNodeSelect(nodeId); // Use handler to clear connection selection
    setDragState({
      isDragging: true,
      mode: 'NODE',
      startPos: { x: e.clientX, y: e.clientY },
      nodeStartPos: { ...node.position },
      draggedNodeId: nodeId,
    });
  };

  const handleStartConnection = (nodeId: string, type: 'input' | 'output', e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'output') {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setDragState({
        isDragging: true,
        mode: 'CONNECTION',
        startPos: { x: e.clientX, y: e.clientY },
        connectionStartNodeId: nodeId,
        connectionCurrentPos: worldPos,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    const { clientX, clientY } = e;

    if (dragState.mode === 'CANVAS') {
      // Direct update for canvas pan to avoid drift in iterative calculation
      const dx = clientX - dragState.startPos.x;
      const dy = clientY - dragState.startPos.y;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragState((prev) => ({ ...prev, startPos: { x: clientX, y: clientY } }));
    } else {
      // Use requestAnimationFrame for Node and Connection dragging
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);

      rAFRef.current = requestAnimationFrame(() => {
        if (dragState.mode === 'NODE' && dragState.draggedNodeId && dragState.nodeStartPos) {
          const dx = (clientX - dragState.startPos.x) / scale;
          const dy = (clientY - dragState.startPos.y) / scale;
          
          setNodes((prev) =>
            prev.map((n) =>
              n.id === dragState.draggedNodeId
                ? { ...n, position: { x: dragState.nodeStartPos!.x + dx, y: dragState.nodeStartPos!.y + dy } }
                : n
            )
          );
        } else if (dragState.mode === 'CONNECTION') {
          const worldPos = screenToWorld(clientX, clientY);
          setDragState((prev) => ({ ...prev, connectionCurrentPos: worldPos }));
        }
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (rAFRef.current) {
       cancelAnimationFrame(rAFRef.current);
       rAFRef.current = undefined;
    }

    if (dragState.mode === 'CONNECTION' && dragState.connectionStartNodeId) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      
      // Find node under cursor
      const targetNode = nodes.find(n => 
        worldPos.x >= n.position.x - 40 && // Allow dropping on the external socket (left side)
        worldPos.x <= n.position.x + n.width &&
        worldPos.y >= n.position.y &&
        worldPos.y <= n.position.y + Math.max(n.height, 400) // Ensure we cover full height
      );

      // Connect if dropping on a GENERATOR
      if (targetNode && targetNode.id !== dragState.connectionStartNodeId && targetNode.type === 'GENERATE_IMAGE') {
        const exists = connections.some(c => c.sourceId === dragState.connectionStartNodeId && c.targetId === targetNode.id);
        if (!exists) {
          setConnections(prev => [...prev, {
            id: crypto.randomUUID(),
            sourceId: dragState.connectionStartNodeId!,
            targetId: targetNode.id
          }]);
        }
      }
    }

    setDragState({
      isDragging: false,
      mode: 'IDLE',
      startPos: { x: 0, y: 0 },
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const newScale = Math.min(Math.max(scale - e.deltaY * 0.001, 0.1), 3);
    setScale(newScale);
  };

  // Connection Points Calculations
  const getOutputCoords = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    // Start from the edge of the node where the gland is
    // Gland is at -right-2 (8px). Center is ~ width + 8.
    return { x: node.position.x + node.width + 8, y: node.position.y + 120 }; 
  };
  
  const getInputCoords = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    // Connect to the socket which is positioned slightly below the header, outside the left edge
    return { x: node.position.x - 12, y: node.position.y + 120 };
  };

  return (
    <div className="w-screen h-screen bg-canvas text-txt-main overflow-hidden flex flex-col font-sans transition-colors duration-300">
      
      {/* Top Bar */}
      <div className="h-14 border-b border-border bg-panel flex items-center justify-between px-6 z-50 shadow-md transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
             <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-txt-main to-txt-muted">
            河马体画布 <span className="text-primary text-sm font-normal ml-1 border border-primary/30 px-1.5 py-0.5 rounded-full bg-primary/10">GenAI</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-bg-input rounded-lg p-1 border border-border">
             <button 
                onClick={() => addNode('IMAGE_UPLOAD')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-bg-hover transition-colors text-sm font-medium text-txt-muted hover:text-txt-main"
             >
                <ImageIcon size={16} />
                <span>添加图片</span>
             </button>
             <div className="w-px bg-border my-1 mx-1"></div>
             <button 
                onClick={() => addNode('GENERATE_IMAGE')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-bg-hover transition-colors text-sm font-medium text-primary hover:text-primary-hover"
             >
                <Zap size={16} fill="currentColor" />
                <span>添加生成器</span>
             </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex bg-bg-input rounded-lg p-1 border border-border items-center">
             <button 
                onClick={handleZoomOut}
                className="p-1.5 rounded hover:bg-bg-hover text-txt-muted hover:text-txt-main transition-colors"
                title="缩小"
             >
                <ZoomOut size={16} />
             </button>
             <button 
                onClick={handleResetZoom}
                className="px-2 text-xs font-mono text-txt-muted hover:text-txt-main transition-colors min-w-[3rem] text-center"
                title="重置 100%"
             >
                {Math.round(scale * 100)}%
             </button>
             <button 
                onClick={handleZoomIn}
                className="p-1.5 rounded hover:bg-bg-hover text-txt-muted hover:text-txt-main transition-colors"
                title="放大"
             >
                <ZoomIn size={16} />
             </button>
          </div>
          
          <div className="h-6 w-px bg-border"></div>

          {/* Auth Section */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
          ) : user ? (
            <UserInfo onOpenAPIKeyConfig={() => setIsAPIKeyConfigOpen(true)} />
          ) : (
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-md transition-colors text-sm font-medium"
              title="登录"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">登录</span>
            </button>
          )}

          <div className="h-6 w-px bg-border"></div>

          <button
            className="p-2 text-txt-muted hover:text-txt-main transition-colors"
            title={theme === 'dark' ? '切换亮色模式' : '切换暗色模式'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className="p-2 text-txt-muted hover:text-txt-main transition-colors" title="Github">
            <Github size={20} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={canvasRef}
        className="flex-1 relative cursor-grab active:cursor-grabbing bg-dot-pattern bg-[length:20px_20px]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          backgroundPosition: `${offset.x}px ${offset.y}px`
        }}
      >
        <div 
          className="absolute origin-top-left transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
          }}
        >
          {/* Connection Lines Layer */}
          <svg className="overflow-visible absolute top-0 left-0 pointer-events-auto" style={{ width: 1, height: 1 }}>
            {connections.map(conn => (
              <ConnectionLine 
                key={conn.id}
                id={conn.id}
                start={getOutputCoords(conn.sourceId)}
                end={getInputCoords(conn.targetId)}
                isSelected={selectedConnectionId === conn.id}
                onSelect={handleConnectionSelect}
                onDelete={deleteConnection}
              />
            ))}
            
            {/* Temp line while dragging */}
            {dragState.mode === 'CONNECTION' && dragState.connectionStartNodeId && dragState.connectionCurrentPos && (
               <ConnectionLine
                 start={getOutputCoords(dragState.connectionStartNodeId)}
                 end={dragState.connectionCurrentPos}
                 isSelected={false} // Dragging line is not fully lit yet (maybe dim)
               />
            )}
          </svg>

          {/* Nodes Layer */}
          {nodes.map(node => {
            const isOutputConnected = connections.some(c => c.sourceId === node.id);
            const isDragging = dragState.mode === 'CONNECTION' && dragState.connectionStartNodeId === node.id;
            return (
              <NodeComponent
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isOutputConnected={isOutputConnected}
                isDraggingConnection={isDragging}
                onMouseDown={handleNodeMouseDown}
                onSelect={handleNodeSelect}
                onDelete={deleteNode}
                onUpdateData={updateNodeData}
                onStartConnection={handleStartConnection}
                onTriggerGeneration={handleTriggerGeneration}
                onLabelClick={handleLabelClick}
                onAnnotationClick={handleAnnotationClick}
                onPreviewImage={setPreviewImage}
              />
            );
          })}
        </div>

  
        {/* Floating Help/Stats - Collapsible & Editable */}
        <div 
           className={`absolute bottom-6 right-6 bg-panel/95 backdrop-blur border border-border rounded-lg shadow-xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col z-50 ${
             isHelpOpen ? 'w-80 h-auto' : 'w-10 h-10 rounded-full hover:scale-110 cursor-pointer'
           }`}
           onClick={(e) => {
             if (!isHelpOpen) {
               setIsHelpOpen(true);
               e.stopPropagation();
             }
           }}
        >
           {/* Header / Toggle */}
           <div className={`flex items-center ${isHelpOpen ? 'justify-between px-3 py-2 border-b border-border bg-bg-input/50' : 'justify-center h-full w-full'}`}>
              {isHelpOpen && (
                 <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Info size={16} />
                    <span>使用说明</span>
                 </div>
              )}
              
              <div className="flex items-center gap-1">
                 {isHelpOpen && !isEditingHelp && (
                    <button 
                       onClick={(e) => { e.stopPropagation(); setIsEditingHelp(true); }}
                       className="p-1 hover:bg-bg-hover rounded text-txt-muted hover:text-txt-main"
                       title="编辑说明"
                    >
                       <Edit2 size={14} />
                    </button>
                 )}
                 
                 {isHelpOpen && isEditingHelp && (
                    <button 
                       onClick={(e) => { e.stopPropagation(); setIsEditingHelp(false); }}
                       className="p-1 hover:bg-green-900/30 rounded text-green-400"
                       title="完成编辑"
                    >
                       <Check size={14} />
                    </button>
                 )}

                 <button
                    onClick={(e) => {
                       e.stopPropagation();
                       setIsHelpOpen(!isHelpOpen);
                       if (!isHelpOpen) setIsEditingHelp(false); 
                    }}
                    className={`${isHelpOpen ? 'p-1 hover:bg-bg-hover rounded text-txt-muted hover:text-txt-main' : 'text-primary'}`}
                 >
                    {isHelpOpen ? <X size={14} /> : <HelpCircle size={24} />}
                 </button>
              </div>
           </div>

           {/* Content */}
           {isHelpOpen && (
              <div className="p-3 text-xs text-txt-muted leading-relaxed max-h-[300px] overflow-y-auto">
                 {isEditingHelp ? (
                    <textarea 
                       className="w-full h-32 bg-bg-input border border-border rounded p-2 text-xs text-txt-main focus:outline-none focus:border-primary resize-none"
                       value={helpContent}
                       onChange={(e) => setHelpContent(e.target.value)}
                       onMouseDown={(e) => e.stopPropagation()} // Allow selecting text without dragging canvas
                    />
                 ) : (
                    <div className="whitespace-pre-wrap">{helpContent}</div>
                 )}
              </div>
           )}
        </div>

        {nodes.length === 0 && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-txt-muted">
                 <MousePointer2 size={48} className="mx-auto mb-4 opacity-50" />
                 <h2 className="text-2xl font-bold mb-2">无限创意画板</h2>
                 <p>请从上方工具栏添加节点开始。</p>
              </div>
           </div>
        )}

        {/* Image Preview Modal */}
        {previewImage && (
           <div 
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200"
              onClick={() => setPreviewImage(null)}
           >
              <button 
                 className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                 onClick={() => setPreviewImage(null)}
              >
                 <X size={32} />
              </button>
              <img 
                 src={previewImage} 
                 alt="Preview" 
                 className="max-w-full max-h-full object-contain rounded shadow-2xl animate-in zoom-in-95 duration-200"
                 onClick={(e) => e.stopPropagation()}
              />
           </div>
        )}

        
        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
        />

        {/* API Key Config Modal */}
        <APIKeyConfig
          isOpen={isAPIKeyConfigOpen}
          onClose={() => setIsAPIKeyConfigOpen(false)}
        />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;