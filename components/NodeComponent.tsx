import React, { useRef, ChangeEvent, useState } from 'react';
import { Node, NodeType, Layer } from '../types';
import { Upload, X, Loader2, Play, Image as ImageIcon, Settings2, Sparkles, Hash, Target, Eraser, Layers, Plus, Eye, EyeOff, Trash2, Maximize2, Plug2, GripHorizontal, Download } from 'lucide-react';

interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  isOutputConnected?: boolean;
  isDraggingConnection?: boolean; 
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onUpdateData: (nodeId: string, data: Partial<Node['data']>) => void;
  onStartConnection: (nodeId: string, type: 'input' | 'output', e: React.MouseEvent) => void;
  onTriggerGeneration: (nodeId: string) => void;
  onLabelClick: (nodeId: string) => void;
  onAnnotationClick: (nodeId: string, annotationId: number) => void;
  onPreviewImage: (url: string) => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  isOutputConnected = false,
  isDraggingConnection = false,
  onMouseDown,
  onSelect,
  onDelete,
  onUpdateData,
  onStartConnection,
  onTriggerGeneration,
  onLabelClick,
  onAnnotationClick,
  onPreviewImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateData(node.id, { imageUrl: event.target.result as string, annotations: [] });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (!isAnnotating || !imageContainerRef.current || !node.data.imageUrl) return;
    
    e.stopPropagation(); // Prevent node drag start
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const currentAnnotations = node.data.annotations || [];
    const newId = currentAnnotations.length > 0 
      ? Math.max(...currentAnnotations.map(a => a.id)) + 1 
      : 1;

    onUpdateData(node.id, {
      annotations: [...currentAnnotations, { id: newId, x, y }]
    });
  };

  const handleClearAnnotations = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateData(node.id, { annotations: [] });
  };

  // Layer Management
  const addLayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentLayers = node.data.layers || [];
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: `图层 ${currentLayers.length + 1}`,
      prompt: '',
      isEnabled: true,
    };
    onUpdateData(node.id, { layers: [...currentLayers, newLayer] });
  };

  const updateLayer = (layerId: string, updates: Partial<Layer>) => {
    const currentLayers = node.data.layers || [];
    const newLayers = currentLayers.map(l => l.id === layerId ? { ...l, ...updates } : l);
    onUpdateData(node.id, { layers: newLayers });
  };

  const deleteLayer = (layerId: string) => {
    const currentLayers = node.data.layers || [];
    if (currentLayers.length <= 1) return; // Prevent deleting the last layer
    onUpdateData(node.id, { layers: currentLayers.filter(l => l.id !== layerId) });
  };

  const handleSelectGeneratedImage = (index: number) => {
    if (!node.data.generatedImages || !node.data.generatedImages[index]) return;
    onUpdateData(node.id, {
      selectedImageIndex: index,
      generatedImage: node.data.generatedImages[index]
    });
  };

  // Download image function
  const handleDownloadImage = (imageUrl: string, index?: number) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const modelShortName = node.data.model === 'gemini-2.5-flash-image-preview' ? 'gemini-2.5-flash' :
                           node.data.model === 'gemini-3-pro-image-preview' ? 'gemini-3.0-pro' :
                           node.data.model === 'gemini-2.0-flash-preview-image-generation' ? 'gemini-2.0-flash' : 'gemini';

    const filename = `${node.data.title || 'generated-image'}-${modelShortName}-${index !== undefined ? `batch-${index + 1}-` : ''}${timestamp}.png`;

    // Extract base64 data
    let base64Data = imageUrl;
    if (imageUrl.startsWith('data:')) {
      // Remove data URL prefix
      base64Data = imageUrl.split(',')[1] || imageUrl;
    }

    // Create blob and download
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
      alert('图片下载失败，请重试');
    }
  };

  // Download all generated images
  const handleDownloadAllImages = () => {
    if (!node.data.generatedImages || node.data.generatedImages.length === 0) return;

    if (node.data.generatedImages.length === 1) {
      handleDownloadImage(node.data.generatedImages[0]);
    } else {
      node.data.generatedImages.forEach((img, index) => {
        setTimeout(() => {
          handleDownloadImage(img, index);
        }, index * 200); // Add small delay between downloads
      });
    }
  };

  const isGenerating = node.data.status === 'loading';

  return (
    <div
      className={`absolute flex flex-col bg-panel border-2 rounded-lg shadow-xl overflow-visible group transition-all duration-300 ${
        isGenerating 
          ? 'border-primary shadow-primary/30 shadow-2xl scale-[1.01] z-50' 
          : isSelected 
            ? 'border-primary shadow-primary/20 z-10' 
            : 'border-border shadow-black/50 z-0'
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
        height: 'auto',
        minHeight: node.height,
        transform: 'translate(0, 0)', // Force GPU layer
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
    >
        {/* --- SOCKET (Input for Generator) --- */}
        {node.type === 'GENERATE_IMAGE' && (
          <div className="absolute -left-5 top-[120px] -translate-y-1/2 group/socket z-50">
             <div className="w-5 h-8 bg-bg-input border-2 border-border rounded-l-md border-r-0 flex items-center justify-center shadow-lg relative z-20 group-hover/socket:border-primary transition-colors cursor-crosshair">
                <div className="flex flex-col gap-1.5">
                   <div className="w-1 h-1 bg-txt-muted rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"></div>
                   <div className="w-1 h-1 bg-txt-muted rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"></div>
                </div>
             </div>
             <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-[10px] text-txt-muted font-bold opacity-0 group-hover/socket:opacity-100 transition-opacity whitespace-nowrap bg-bg-input px-2 py-1 rounded border border-border pointer-events-none">
                插入图片
             </div>
          </div>
        )}
        
        {/* --- PLUG (Output for Image Upload) --- */}
        {node.type === 'IMAGE_UPLOAD' && (
           <>
              <div className="absolute -right-2 top-[120px] -translate-y-1/2 w-3 h-6 bg-bg-hover border border-border rounded-r-sm border-l-0 z-10" />
              {!isOutputConnected && !isDraggingConnection && (
                 <div className="absolute left-full top-[120px] -translate-y-1/2 pointer-events-none z-50 overflow-visible">
                    <svg width="80" height="100" className="overflow-visible" style={{ transform: 'translate(0, 0)' }}>
                       <path d="M 0 0 C 30 0, 30 50, 50 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-border" />
                       <foreignObject x="35" y="45" width="40" height="40" className="overflow-visible">
                          <div 
                             className="w-10 h-10 bg-bg-hover border-2 border-border rounded-full flex items-center justify-center cursor-grab hover:scale-110 active:cursor-grabbing hover:border-primary shadow-lg pointer-events-auto transition-transform"
                             onMouseDown={(e) => onStartConnection(node.id, 'output', e)}
                             title="拖拽插头连接到生成器"
                          >
                             <Plug2 size={20} className="text-txt-muted rotate-45" />
                          </div>
                       </foreignObject>
                    </svg>
                 </div>
              )}
           </>
        )}

      {/* Header */}
      <div className={`h-10 flex items-center justify-between px-2 pl-3 border-b border-border cursor-grab active:cursor-grabbing transition-colors rounded-t-md ${
        isGenerating ? 'bg-primary/20' : 'bg-bg-input/50'
      }`}>
        <div className="flex items-center gap-2 text-txt-muted font-medium text-sm">
          {/* Clickable ID Badge */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onLabelClick(node.id);
            }}
            onMouseDown={(e) => e.stopPropagation()} 
            className="flex items-center gap-1 bg-bg-hover hover:bg-primary hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors border border-border hover:border-primary select-none text-txt-main"
            title="点击将编号插入当前选中的提示词中"
          >
            <Hash size={10} />
            <span className="font-bold">图{node.data.displayId}</span>
          </div>

          <div className="flex items-center gap-1.5 opacity-80">
            {node.type === 'IMAGE_UPLOAD' ? <Upload size={14} /> : <Settings2 size={14} />}
            <span className="truncate max-w-[100px] text-txt-main">{node.data.title}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="text-txt-muted hover:text-red-400 transition-colors p-1"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-3 relative bg-panel h-full rounded-b-md">
        
        {/* Content */}
        {node.type === 'IMAGE_UPLOAD' && (
          <div className="flex flex-col gap-2">
            {node.data.imageUrl ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <div className="flex gap-2">
                     <button
                        onClick={(e) => {
                           e.stopPropagation();
                           setIsAnnotating(!isAnnotating);
                        }}
                        className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                           isAnnotating 
                           ? 'bg-red-500/20 text-red-500 border-red-500/50' 
                           : 'bg-bg-input text-txt-muted border-border hover:bg-bg-hover'
                        }`}
                     >
                        <Target size={12} />
                        {isAnnotating ? '退出标注' : '添加标注'}
                     </button>
                     {isAnnotating && (
                        <button
                           onClick={handleClearAnnotations}
                           className="text-[10px] flex items-center gap-1 px-2 py-1 rounded border border-border bg-bg-input text-txt-muted hover:bg-bg-hover transition-colors"
                        >
                           <Eraser size={12} />
                           清空
                        </button>
                     )}
                  </div>
                </div>

                <div 
                  ref={imageContainerRef}
                  className={`relative group/image rounded-md border border-border bg-bg-input overflow-hidden ${isAnnotating ? 'cursor-crosshair ring-2 ring-red-500/30' : ''}`}
                  onClick={handleImageClick}
                >
                   <img
                    src={node.data.imageUrl}
                    alt="Uploaded"
                    className="w-full h-auto max-h-[400px] object-contain block" 
                    draggable={false}
                  />
                  
                  {/* Annotations Overlay */}
                  {node.data.annotations?.map((ann) => (
                     <div
                        key={ann.id}
                        onClick={(e) => {
                           e.stopPropagation();
                           onAnnotationClick(node.id, ann.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()} 
                        className="absolute w-5 h-5 -ml-2.5 -mt-2.5 bg-red-500 hover:bg-red-600 hover:scale-125 hover:z-20 cursor-pointer rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white shadow-md z-10 animate-in zoom-in duration-200 transition-all"
                        style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                        title={`点击插入 [图${node.data.displayId} 标${ann.id}]`}
                     >
                        {ann.id}
                     </div>
                  ))}

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className={`absolute inset-0 bg-black/50 items-center justify-center text-white text-xs transition-opacity ${isAnnotating ? 'hidden' : 'hidden group-hover/image:flex opacity-0 group-hover/image:opacity-100'}`}
                  >
                    更换图片
                  </button>
                </div>
                
                {node.data.annotations && node.data.annotations.length > 0 && (
                   <div className="text-[10px] text-txt-muted px-1">
                      已添加 {node.data.annotations.length} 个标注点。点击红点可将其插入提示词。
                   </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center text-txt-muted hover:border-txt-muted hover:text-txt-main cursor-pointer transition-colors"
              >
                <ImageIcon size={24} className="mb-2" />
                <span className="text-xs">点击上传图片</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        )}

        {node.type === 'GENERATE_IMAGE' && (
          <div className="flex flex-col gap-3 pl-3">
             <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center mb-1">
                   <label className="text-[10px] text-txt-muted uppercase font-bold tracking-wider flex items-center gap-1">
                     <Layers size={10} />
                     <span>图层 (Layers)</span>
                   </label>
                   <button 
                      onClick={addLayer}
                      className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 bg-bg-input hover:bg-primary rounded text-txt-muted hover:text-white transition-colors border border-border"
                   >
                      <Plus size={10} />
                      添加
                   </button>
                </div>
                
                {/* Layer List */}
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                   {(node.data.layers || []).map((layer) => (
                      <div key={layer.id} className={`bg-bg-input/50 border rounded-md p-2 flex flex-col gap-2 ${layer.isEnabled ? 'border-border' : 'border-border opacity-60'}`}>
                         <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                               <button 
                                  onClick={() => updateLayer(layer.id, { isEnabled: !layer.isEnabled })}
                                  className={`p-1 rounded hover:bg-bg-hover transition-colors ${layer.isEnabled ? 'text-primary' : 'text-txt-muted'}`}
                                  title={layer.isEnabled ? "关闭图层" : "开启图层"}
                               >
                                  {layer.isEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
                               </button>
                               <input 
                                  type="text"
                                  value={layer.name}
                                  onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                                  className="bg-transparent border-b border-transparent hover:border-border focus:border-primary text-xs text-txt-main focus:outline-none w-full px-1"
                                  placeholder="图层名称"
                                  onMouseDown={(e) => e.stopPropagation()}
                               />
                            </div>
                            <button 
                               onClick={() => deleteLayer(layer.id)}
                               className="text-txt-muted hover:text-red-400 transition-colors p-1"
                               title="删除图层"
                            >
                               <Trash2 size={12} />
                            </button>
                         </div>
                         <textarea
                           className="w-full h-16 bg-bg-input border border-border rounded p-2 text-xs text-txt-main focus:outline-none focus:border-primary resize-none placeholder-txt-muted leading-relaxed"
                           placeholder="在此输入提示词，例如：在[图1 标2]处生成..."
                           value={layer.prompt}
                           onChange={(e) => updateLayer(layer.id, { prompt: e.target.value })}
                           onFocus={() => onSelect(node.id)} 
                           onMouseDown={(e) => e.stopPropagation()} 
                         />
                      </div>
                   ))}
                </div>
             </div>

             {/* Generation Configs */}
             <div className="grid grid-cols-3 gap-2">
                {/* Model Selection */}
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-txt-muted uppercase font-bold tracking-wider">AI模型</label>
                   <select
                      className="bg-bg-input border border-border rounded text-xs text-txt-main p-1.5 focus:outline-none focus:border-primary"
                      value={node.data.model || 'gemini-2.5-flash-image-preview'}
                      onChange={(e) => onUpdateData(node.id, { model: e.target.value })}
                      onMouseDown={(e) => e.stopPropagation()}
                   >
                     <option value="gemini-2.5-flash-image-preview">Gemini 2.5 Flash</option>
                     <option value="gemini-3-pro-image-preview">Gemini 3.0 Pro</option>
                     <option value="gemini-2.0-flash-preview-image-generation">Gemini 2.0 Flash</option>
                   </select>
                </div>

                {/* Aspect Ratio */}
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-txt-muted uppercase font-bold tracking-wider">画幅</label>
                   <select
                      className="bg-bg-input border border-border rounded text-xs text-txt-main p-1.5 focus:outline-none focus:border-primary"
                      value={node.data.aspectRatio || '1:1'}
                      onChange={(e) => onUpdateData(node.id, { aspectRatio: e.target.value as any })}
                      onMouseDown={(e) => e.stopPropagation()}
                   >
                     <option value="1:1">1:1 (方形)</option>
                     <option value="16:9">16:9 (横向)</option>
                     <option value="9:16">9:16 (纵向)</option>
                   </select>
                </div>

                {/* Resolution */}
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-txt-muted uppercase font-bold tracking-wider">分辨率</label>
                   <select
                      className="bg-bg-input border border-border rounded text-xs text-txt-main p-1.5 focus:outline-none focus:border-primary"
                      value={node.data.imageResolution || '1K'}
                      onChange={(e) => onUpdateData(node.id, { imageResolution: e.target.value as any })}
                      onMouseDown={(e) => e.stopPropagation()}
                   >
                     <option value="1K">1K (标准)</option>
                     <option value="2K">2K (高清)</option>
                     <option value="4K">4K (超清)</option>
                   </select>
                </div>

                {/* Number of Images - Spanning full width if needed, or row below */}
                <div className="flex flex-col gap-1 col-span-3">
                   <label className="text-[10px] text-txt-muted uppercase font-bold tracking-wider flex justify-between">
                      <span>生成数量</span>
                      <span className="text-primary">{node.data.numberOfImages || 1} 张</span>
                   </label>
                   <div className="flex bg-bg-input border border-border rounded p-1">
                      {[1, 2, 3, 4].map(num => (
                         <button
                           key={num}
                           onClick={() => onUpdateData(node.id, { numberOfImages: num })}
                           className={`flex-1 text-xs py-1 rounded transition-colors ${
                              (node.data.numberOfImages || 1) === num 
                                ? 'bg-primary text-white font-medium' 
                                : 'text-txt-muted hover:text-txt-main hover:bg-bg-hover'
                           }`}
                         >
                            {num}
                         </button>
                      ))}
                   </div>
                </div>
             </div>

             <button
              onClick={(e) => {
                e.stopPropagation();
                onTriggerGeneration(node.id);
              }}
              disabled={isGenerating}
              className={`w-full py-2 rounded-md flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-all ${
                isGenerating
                  ? 'bg-bg-input text-txt-muted cursor-not-allowed border border-border'
                  : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-indigo-500/20'
              }`}
             >
               {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
               {isGenerating ? '正在绘制...' : '开始生成'}
             </button>

             {/* 运行中反馈 */}
             {isGenerating && (
                <div className="mt-2 w-full aspect-square bg-bg-input rounded-md border border-primary/30 flex flex-col items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-900/20 to-transparent animate-pulse"></div>
                   <div className="absolute w-full h-1/2 bg-gradient-to-b from-transparent via-primary/10 to-transparent top-[-50%] animate-[scan_4s_ease-in-out_infinite]"></div>
                   <div className="z-10 relative mb-4">
                     <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                     <div className="bg-panel/80 p-3 rounded-full backdrop-blur-sm shadow-sm">
                       <Sparkles size={20} className="text-primary" />
                     </div>
                   </div>
                   <div className="z-10 flex flex-col items-center gap-2 w-3/4">
                     <span className="text-[10px] font-bold text-primary/90 uppercase tracking-widest animate-pulse">Processing</span>
                     <div className="w-full h-1 bg-border rounded-full overflow-hidden relative">
                       <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-purple-400 rounded-full animate-[progress_12s_cubic-bezier(0.1,0.7,1.0,0.1)_forwards] w-0"></div>
                     </div>
                   </div>
                   <style>{`
                     @keyframes scan {
                       0% { top: -50%; opacity: 0; }
                       50% { opacity: 1; }
                       100% { top: 100%; opacity: 0; }
                     }
                     @keyframes progress {
                       0% { width: 0%; }
                       20% { width: 30%; }
                       50% { width: 60%; }
                       80% { width: 85%; }
                       100% { width: 92%; }
                     }
                   `}</style>
                </div>
             )}

             {/* Generation Results */}
             {node.data.generatedImage && !isGenerating && (
               <div className="mt-3 flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
                  <div 
                      className="relative group/preview cursor-zoom-in p-2 bg-bg-input rounded-lg border border-border shadow-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewImage(node.data.generatedImage!);
                      }}
                  >
                      {/* Photo Frame Effect */}
                      <div className="relative bg-gradient-to-b from-bg-hover to-bg-input p-1.5 rounded border border-border shadow-inner">
                        <div className="absolute -top-2 -right-2 z-20">
                            <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-white/20">NEW</span>
                        </div>
                        
                        <div className="relative overflow-hidden rounded border border-black/10 dark:border-black/50 bg-canvas">
                            <img
                              src={node.data.generatedImage}
                              alt="Generated"
                              className="w-full h-auto block transform group-hover/preview:scale-[1.02] transition-transform duration-500"
                            />
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                              <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover/preview:opacity-100 transition-all transform scale-75 group-hover/preview:scale-100 duration-200">
                                  <Maximize2 className="text-white drop-shadow-md" size={16} />
                              </div>
                            </div>
                        </div>
                      </div>
                      
                      <div className="mt-1 flex justify-between items-center px-1">
                        <div className="text-[9px] text-txt-muted font-mono tracking-tighter">
                            {node.data.model === 'gemini-2.5-flash-image-preview' ? '2.5 Flash' :
                             node.data.model === 'gemini-3-pro-image-preview' ? '3.0 Pro' :
                             node.data.model === 'gemini-2.0-flash-preview-image-generation' ? '2.0 Flash' : '2.5 Flash'} • {node.data.imageResolution || '1K'} • {node.data.aspectRatio}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(node.data.generatedImage!);
                            }}
                            className="p-1 rounded bg-bg-hover text-txt-muted hover:text-txt-main hover:bg-primary/20 transition-colors"
                            title="下载图片"
                          >
                            <Download size={12} />
                          </button>
                          {node.data.generatedImages && node.data.generatedImages.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadAllImages();
                              }}
                              className="p-1 rounded bg-bg-hover text-txt-muted hover:text-txt-main hover:bg-primary/20 transition-colors"
                              title="下载所有图片"
                            >
                              <Download size={12} />
                              <span className="text-[8px] font-bold">ALL</span>
                            </button>
                          )}
                        </div>
                      </div>
                  </div>

                  {/* Thumbnail Gallery (if multiple images) */}
                  {node.data.generatedImages && node.data.generatedImages.length > 1 && (
                     <div className="space-y-2">
                        <div className="flex gap-2 overflow-x-auto pb-1 px-1">
                           {node.data.generatedImages.map((img, idx) => (
                              <div
                                 key={idx}
                                 className="relative group"
                              >
                                 <div
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleSelectGeneratedImage(idx);
                                    }}
                                    className={`flex-shrink-0 w-12 h-12 rounded border-2 cursor-pointer overflow-hidden transition-all ${
                                       idx === (node.data.selectedImageIndex ?? 0)
                                          ? 'border-primary shadow-lg scale-110 z-10'
                                          : 'border-border opacity-60 hover:opacity-100 hover:border-txt-muted'
                                    }`}
                                 >
                                    <img src={img} className="w-full h-full object-cover" />
                                 </div>
                                 {/* Download button for individual thumbnail */}
                                 <button
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleDownloadImage(img, idx);
                                    }}
                                    className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    title={`下载图片 ${idx + 1}`}
                                 >
                                    <Download size={10} />
                                 </button>
                              </div>
                           ))}
                        </div>
                        {/* Batch download button */}
                        <div className="flex justify-center px-1">
                           <button
                              onClick={(e) => {
                                 e.stopPropagation();
                                 handleDownloadAllImages();
                              }}
                              className="flex items-center gap-1 text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary-hover transition-colors"
                              title="下载所有图片"
                           >
                              <Download size={12} />
                              下载全部 ({node.data.generatedImages.length}张)
                           </button>
                        </div>
                     </div>
                  )}
               </div>
             )}
             
             {node.data.status === 'error' && (
                <div className="text-red-400 text-[10px] mt-1 p-2 bg-red-900/20 rounded border border-red-900/50">
                   生成失败，请重试。
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};