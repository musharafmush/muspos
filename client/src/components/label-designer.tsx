import React, { useState, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import {
  TypeIcon,
  MousePointer2Icon,
  BarcodeIcon,
  ImageIcon,
  UndoIcon,
  RedoIcon,
  SaveIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
  Trash2Icon,
  CopyIcon,
  PlusCircleIcon,
  GridIcon,
  EyeIcon,
  PaletteIcon,
  PlusIcon,
  Settings2Icon,
  LayersIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  SearchIcon,
  LucideIcon,
  MoveIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LabelElement {
  id: string;
  type: 'text' | 'barcode' | 'image' | 'price' | 'mrp' | 'sku';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  textAlign: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: string;
  borderRadius?: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // Padding and margin
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

interface LabelDesignerProps {
  templateData: any;
  onSave: (elements: LabelElement[], dimensions?: { width: number, height: number }) => void;
  onCancel: () => void;
}

// Helper component for barcode preview in designer
function BarcodePreview({ content, width, height }: { content: string, width: number, height: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, content || "12345678", {
          width: 2,
          height: Math.max(height - 10, 20),
          displayValue: false,
          margin: 0,
          background: 'transparent'
        });
      } catch (e) {
        console.error('Barcode generation preview failed', e);
      }
    }
  }, [content, width, height]);

  return <svg ref={svgRef} style={{ width: '100%', height: '100%', minWidth: '100px', minHeight: '40px' }} />;
}

export function LabelDesigner({ templateData, onSave, onCancel }: LabelDesignerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<LabelElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'text' | 'barcode' | 'image'>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialElements, setInitialElements] = useState<LabelElement[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [resizeDir, setResizeDir] = useState<string | null>(null);
  const [width, setWidth] = useState(templateData?.width || 100);
  const [height, setHeight] = useState(templateData?.height || 60);
  const gridSize = 10;

  // Sample data for rendering logic previews
  const SAMPLE_PRODUCT = {
    name: "Visual Blueprint Pro-Node 500",
    price: "1,299.00",
    sku: "VBN-771-X818",
    barcode: "1771243573818",
    mrp: "1,499.00",
    weight: "0.85kg",
    manufacturing_date: "12-02-2026",
    expiry_date: "12-02-2027",
    store: "BLUEPRINT STUDIO",
    template: templateData?.name || "ALPHA-NODE-01"
  };

  const resolveContent = (content: string) => {
    if (!content) return "";
    return content.replace(/\{\{product\.(\w+)\}\}/g, (_, key) => {
      return (SAMPLE_PRODUCT as any)[key] || `[${key}]`;
    });
  };

  // Template dimensions in mm converted to pixels (assuming 96 DPI / 3.78 px per mm)
  const templateWidth = Math.round((parseFloat(String(width)) || 0) * 3.78);
  const templateHeight = Math.round((parseFloat(String(height)) || 0) * 3.78);

  // Initialize with saved elements or default elements based on template settings
  useEffect(() => {
    console.log('Visual designer initializing with template data:', templateData);
    if (templateData) {
      // Check if template has saved elements
      if (Array.isArray(templateData.elements) && templateData.elements.length > 0) {
        console.log('Loading saved elements:', templateData.elements);
        setElements(templateData.elements);
        return;
      }

      // Otherwise, create default elements
      const defaultElements: LabelElement[] = [];

      // Add product name
      defaultElements.push({
        id: 'product-name',
        type: 'text',
        x: 10,
        y: 10,
        width: templateWidth - 20,
        height: 50,
        content: '{{product.name}}',
        fontSize: templateData.font_size || 16,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        color: templateData.text_color || '#000000',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: '#000000',
        borderStyle: 'none',
        rotation: 0,
        opacity: 1,
        zIndex: 1
      });

      // Add price if enabled
      if (templateData.include_price) {
        defaultElements.push({
          id: 'price',
          type: 'price',
          x: 10,
          y: templateHeight / 2 - 10,
          width: templateWidth - 20,
          height: 40,
          content: '{{product.price}}',
          fontSize: (templateData.font_size || 16) + 4,
          fontWeight: 'bold',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: templateData.text_color || '#000000',
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderColor: '#000000',
          borderStyle: 'none',
          rotation: 0,
          opacity: 1,
          zIndex: 2
        });
      }

      // Add MRP if enabled
      if (templateData.include_mrp) {
        defaultElements.push({
          id: 'mrp',
          type: 'mrp',
          x: 10,
          y: templateHeight / 2 + 25,
          width: templateWidth - 20,
          height: 35,
          content: '{{product.mrp}}',
          fontSize: (templateData.font_size || 16) - 2,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'line-through',
          textAlign: 'center',
          color: '#666666',
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderColor: '#000000',
          borderStyle: 'none',
          rotation: 0,
          opacity: 1,
          zIndex: 2
        });
      }

      // Add SKU
      defaultElements.push({
        id: 'sku',
        type: 'sku',
        x: 10,
        y: templateHeight - 25,
        width: templateWidth - 20,
        height: 20,
        content: '{{product.sku}}',
        fontSize: 10,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        color: '#666666',
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: '#000000',
        borderStyle: 'none',
        rotation: 0,
        opacity: 1,
        zIndex: 2
      });

      // Add barcode if enabled
      if (templateData.include_barcode) {
        const isTop = templateData.barcode_position === 'top';
        defaultElements.push({
          id: 'barcode',
          type: 'barcode',
          x: 10,
          y: isTop ? 5 : templateHeight - 65,
          width: templateWidth - 20,
          height: 55,
          content: '{{product.barcode}}',
          fontSize: 10,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'center',
          color: '#000000',
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderColor: '#cccccc',
          borderStyle: 'solid',
          rotation: 0,
          opacity: 1,
          zIndex: 3
        });

        // Push name after barcode to adjust Y if barcode is at top
        const nameElement = defaultElements.find(el => el.id === 'product-name');
        if (nameElement && isTop) {
          nameElement.y = 65; // Move name down to make room for top barcode
        }
      }

      setElements(defaultElements);
    }
  }, []); // Only run once on mount

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool === 'select') {
      setSelectedElement(null);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = templateWidth / (templateWidth * (zoom / 100));
    const scaleY = templateHeight / (templateHeight * (zoom / 100));

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newElement: LabelElement = {
      id: `element-${Date.now()}`,
      type: tool as 'text' | 'barcode' | 'image',
      x,
      y,
      width: tool === 'text' ? 200 : tool === 'barcode' ? 140 : 100,
      height: tool === 'text' ? 40 : tool === 'barcode' ? 70 : 100,
      content: tool === 'text' ? 'New Precision Vector' : tool === 'barcode' ? '{{product.barcode}}' : 'https://placehold.co/400x400/6366f1/ffffff?text=IMAGE',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      color: '#000000',
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderColor: '#cccccc',
      borderStyle: 'solid',
      rotation: 0,
      opacity: 1,
      zIndex: elements.length + 1
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setTool('select');
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    // Note: We don't necessarily want to force 'select' tool here if they are clicking to modify
    // but usually mousedown on element implies selection intent.
    // However, let's keep it as is unless it's part of the reported "not working" issue.
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialElements([...elements]); // Capture snapshot for relative movement
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, dir: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsResizing(true);
    setResizeDir(dir);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialElements([...elements]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizing && selectedElement && resizeDir && initialElements.length > 0) {
      const deltaX = (e.clientX - dragStart.x) / (zoom / 100);
      const deltaY = (e.clientY - dragStart.y) / (zoom / 100);

      setElements(initialElements.map(el => {
        if (el.id !== selectedElement) return el;

        let newX = el.x;
        let newY = el.y;
        let newWidth = el.width;
        let newHeight = el.height;

        if (resizeDir.includes('e')) newWidth = Math.max(20, el.width + deltaX);
        if (resizeDir.includes('s')) newHeight = Math.max(10, el.height + deltaY);
        if (resizeDir.includes('w')) {
          const possibleWidth = el.width - deltaX;
          if (possibleWidth > 20) {
            newWidth = possibleWidth;
            newX = el.x + deltaX;
          }
        }
        if (resizeDir.includes('n')) {
          const possibleHeight = el.height - deltaY;
          if (possibleHeight > 10) {
            newHeight = possibleHeight;
            newY = el.y + deltaY;
          }
        }

        if (snapToGrid) {
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
          newWidth = Math.round(newWidth / gridSize) * gridSize;
          newHeight = Math.round(newHeight / gridSize) * gridSize;
        }

        return {
          ...el,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
          width: newWidth,
          height: newHeight
        };
      }));
      return;
    }

    if (!isDragging || !selectedElement || initialElements.length === 0) return;

    // Total displacement from the moment drag started
    const totalDeltaX = (e.clientX - dragStart.x) / (zoom / 100);
    const totalDeltaY = (e.clientY - dragStart.y) / (zoom / 100);

    setElements(initialElements.map(el => {
      if (el.id !== selectedElement) return el;

      let newX = el.x + totalDeltaX;
      let newY = el.y + totalDeltaY;

      if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      return {
        ...el,
        x: Math.max(0, Math.min(templateWidth - el.width, newX)),
        y: Math.max(0, Math.min(templateHeight - el.height, newY))
      };
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDir(null);
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const duplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;

    const newEl: LabelElement = {
      ...el,
      id: `element-${Date.now()}`,
      x: el.x + 10,
      y: el.y + 10,
      zIndex: elements.length + 1
    };

    setElements([...elements, newEl]);
    setSelectedElement(newEl.id);
  };

  const updateSelectedElement = (updates: Partial<LabelElement>) => {
    if (!selectedElement) return;
    setElements(elements.map(el =>
      el.id === selectedElement ? { ...el, ...updates } : el
    ));
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  const synthesisTools = [
    { id: 'select', icon: MousePointer2Icon, label: 'Select' },
    { id: 'text', icon: TypeIcon, label: 'Text' },
    { id: 'barcode', icon: BarcodeIcon, label: 'Barcode' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Sidebar: Blueprint Studio */}
      <aside className="w-[320px] bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 animate-in zoom-in duration-500">
              <PaletteIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] leading-none mb-1">Blueprint Studio</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Precision Engineering Suite</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-8">
          {/* Synthesis Tools Grid */}
          <section className="space-y-4 mb-10">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <PlusIcon className="h-3 w-3" /> Synthesis Tools
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {synthesisTools.map((t) => (
                <Button
                  key={t.id}
                  variant="ghost"
                  className={`h-20 flex flex-col gap-2 rounded-[1.5rem] transition-all duration-300 border-2 ${tool === t.id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm scale-[1.02]'
                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  onClick={() => {
                    if (tool === t.id) {
                      setTool('select');
                    } else {
                      setTool(t.id as any);
                    }
                  }}
                >
                  <t.icon className={`h-5 w-5 ${tool === t.id ? 'animate-pulse' : ''}`} />
                  <span className="text-[9px] font-bold uppercase tracking-tighter">{t.label}</span>
                </Button>
              ))}
            </div>
          </section>

          {/* Configuration Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MaximizeIcon className="h-3 w-3" /> Canvas Blueprint
              </h4>
              <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-indigo-600 bg-indigo-50/50 uppercase tracking-widest px-2 py-0.5 rounded-lg">
                Adaptive
              </Badge>
            </div>

            <div className="bg-white rounded-[1.25rem] border border-slate-100 p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Width (mm)</Label>
                  <div className="relative group/input">
                    <Input
                      type="number"
                      step="any"
                      value={width}
                      onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                      className="h-11 text-xs font-black bg-slate-50 border-2 border-transparent focus:border-indigo-500/50 rounded-xl text-center transition-all appearance-none outline-none"
                    />
                  </div>
                </div>

                <div className="pt-5">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all active:rotate-180 duration-500"
                    onClick={() => {
                      const w = width;
                      setWidth(height);
                      setHeight(w);
                    }}
                  >
                    <RefreshCwIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex-1 space-y-1.5">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Height (mm)</Label>
                  <div className="relative group/input">
                    <Input
                      type="number"
                      step="any"
                      value={height}
                      onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                      className="h-11 text-xs font-black bg-slate-50 border-2 border-transparent focus:border-indigo-500/50 rounded-xl text-center transition-all appearance-none outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 mt-6">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <GridIcon className="h-3 w-3" /> Workspace Matrix
              </h4>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between p-4 bg-white rounded-[1.25rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="space-y-0.5">
                  <Label htmlFor="snap-grid" className="text-xs font-black text-slate-700 uppercase tracking-wide">Snap to Grid</Label>
                  <p className="text-[10px] text-slate-400 font-medium">Automatic {gridSize}px alignment</p>
                </div>
                <Switch
                  id="snap-grid"
                  checked={snapToGrid}
                  onCheckedChange={setSnapToGrid}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-[1.25rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="space-y-0.5">
                  <Label htmlFor="show-grid" className="text-xs font-black text-slate-700 uppercase tracking-wide">Visual Grid</Label>
                  <p className="text-[10px] text-slate-400 font-medium">Toggle matrix visibility</p>
                </div>
                <Switch
                  id="show-grid"
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-slate-100 my-8" />

          {/* Contextual Properties */}
          {selectedEl ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings2Icon className="h-3.5 w-3.5" /> Component Logic
                </h4>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-2 rounded-lg text-[10px] font-black uppercase tracking-widest py-1 leading-none h-auto">
                  {selectedEl.type}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50/50 rounded-[1.5rem] border border-slate-100 p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dynamic Payload</Label>
                    {['text', 'sku', 'price', 'mrp'].includes(selectedEl.type) ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {['name', 'price', 'sku', 'barcode', 'mrp', 'weight', 'store', 'template'].map(field => (
                            <button
                              key={field}
                              onClick={() => {
                                const newContent = selectedEl.content ? (selectedEl.content + ` {{product.${field}}}`) : `{{product.${field}}}`;
                                updateSelectedElement({ content: newContent });
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            >
                              +{field}
                            </button>
                          ))}
                        </div>
                        <Input
                          value={selectedEl.content}
                          onChange={(e) => updateSelectedElement({ content: e.target.value })}
                          className="h-10 text-xs font-bold bg-white border-slate-200 rounded-xl focus:ring-indigo-600"
                          placeholder="Inject logic or manual text..."
                        />
                      </div>
                    ) : selectedEl.type === 'barcode' ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Source</span>
                          <Badge variant="outline" className="text-[9px] font-bold border-indigo-100 text-indigo-600">Product Barcode</Badge>
                        </div>
                        <Input
                          value={selectedEl.content}
                          onChange={(e) => updateSelectedElement({ content: e.target.value })}
                          className="h-10 text-xs font-bold bg-white border-slate-200 rounded-xl focus:ring-indigo-600"
                          placeholder="Barcode content..."
                        />
                      </div>
                    ) : selectedEl.type === 'image' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Source URL</Label>
                          <Input
                            value={selectedEl.content}
                            onChange={(e) => updateSelectedElement({ content: e.target.value })}
                            className="h-10 text-[10px] font-bold bg-white border-slate-200 rounded-xl focus:ring-indigo-600"
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Local Asset Injection</Label>
                          <div className="relative">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    updateSelectedElement({ content: event.target?.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="h-10 text-[9px] font-bold bg-white border-slate-200 rounded-xl cursor-pointer p-2 pr-10 file:hidden"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ImageIcon className="h-4 w-4 text-slate-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fixed Data Vector</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Typography Hub */}
                {['text', 'sku', 'price', 'mrp'].includes(selectedEl.type) && (
                  <div className="bg-slate-50/50 rounded-[1.5rem] border border-slate-100 p-4 space-y-4">
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                      <span>Typography Force</span>
                      <span>{selectedEl.fontSize}px</span>
                    </div>
                    <Slider
                      value={[selectedEl.fontSize || 12]}
                      min={6}
                      max={120}
                      step={1}
                      onValueChange={([val]) => updateSelectedElement({ fontSize: val })}
                      className="py-2"
                    />
                  </div>
                )}

                <div className="bg-slate-50/50 rounded-[1.5rem] border border-slate-100 p-4 space-y-4">
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                    <span>Frame / Border</span>
                    <span>{selectedEl.borderWidth}px</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Style</Label>
                      <Select
                        value={selectedEl.borderStyle || 'none'}
                        onValueChange={(v) => updateSelectedElement({ borderStyle: v, borderWidth: v === 'none' ? 0 : (selectedEl.borderWidth || 1) })}
                      >
                        <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-[10px]">None</SelectItem>
                          <SelectItem value="solid" className="text-[10px]">Solid</SelectItem>
                          <SelectItem value="dashed" className="text-[10px]">Dashed</SelectItem>
                          <SelectItem value="dotted" className="text-[10px]">Dotted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Width</Label>
                      <Input
                        type="number"
                        value={selectedEl.borderWidth}
                        onChange={(e) => updateSelectedElement({ borderWidth: parseInt(e.target.value) || 0 })}
                        className="h-8 text-[10px] font-bold bg-white border-slate-200 rounded-lg text-center"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Radius</Label>
                      <Input
                        type="number"
                        value={selectedEl.borderRadius || 0}
                        onChange={(e) => updateSelectedElement({ borderRadius: parseInt(e.target.value) || 0 })}
                        className="h-8 text-[10px] font-bold bg-white border-slate-200 rounded-lg text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Color</Label>
                      <div className="flex gap-2 items-center bg-white border border-slate-200 rounded-lg px-2 h-8">
                        <input
                          type="color"
                          value={selectedEl.borderColor || '#cccccc'}
                          onChange={(e) => updateSelectedElement({ borderColor: e.target.value })}
                          className="w-4 h-4 p-0 border-none bg-transparent cursor-pointer"
                        />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{selectedEl.borderColor || '#ccc'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-[1.5rem] border border-slate-100 p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                        <span>X-Axis</span>
                      </div>
                      <Input
                        type="number"
                        value={Math.round(selectedEl.x)}
                        onChange={(e) => updateSelectedElement({ x: parseInt(e.target.value) || 0 })}
                        className="h-10 text-[11px] font-bold bg-white border-slate-200 rounded-xl text-center focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                        <span>Y-Axis</span>
                      </div>
                      <Input
                        type="number"
                        value={Math.round(selectedEl.y)}
                        onChange={(e) => updateSelectedElement({ y: parseInt(e.target.value) || 0 })}
                        className="h-10 text-[11px] font-bold bg-white border-slate-200 rounded-xl text-center focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                        <span>Width</span>
                      </div>
                      <Input
                        type="number"
                        value={Math.round(selectedEl.width)}
                        onChange={(e) => updateSelectedElement({ width: parseInt(e.target.value) || 0 })}
                        className="h-10 text-[11px] font-bold bg-white border-slate-200 rounded-xl text-center focus:ring-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                        <span>Height</span>
                      </div>
                      <Input
                        type="number"
                        value={Math.round(selectedEl.height)}
                        onChange={(e) => updateSelectedElement({ height: parseInt(e.target.value) || 0 })}
                        className="h-10 text-[11px] font-bold bg-white border-slate-200 rounded-xl text-center focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-1 h-12 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
                    onClick={() => duplicateElement(selectedEl.id)}
                  >
                    <CopyIcon className="h-4 w-4 mr-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Clone</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-1 h-12 bg-white border border-slate-100 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm group"
                    onClick={() => deleteElement(selectedEl.id)}
                  >
                    <Trash2Icon className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Purge</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center border border-slate-100 animate-pulse">
                <MousePointer2Icon className="h-6 w-6 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">System Awaiting Selection</p>
                <p className="text-[9px] text-slate-300 font-medium mt-1">Select a vector component to modify its logic</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* Main Designer Hub */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#f1f5f9]">
        {/* Pro Design Panel: Header */}
        <div className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 flex items-center justify-between z-20 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-[15px] font-black text-slate-900 tracking-tight flex items-center gap-3">
                <span className="text-slate-400 uppercase tracking-[0.2em] font-black text-[11px]">Visual Blueprint</span>
                {templateData?.name || 'Experimental Design'}
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] font-black border-slate-200 text-slate-400 bg-slate-50 uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-full">
                  {Number(width).toFixed(1).replace(/\.0$/, '')}mm × {Number(height).toFixed(1).replace(/\.0$/, '')}mm Dimensions
                </Badge>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active Link: Production Node</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
              <div className="flex flex-col items-end px-3">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Optical Zoom</span>
              </div>
              <Select value={String(zoom)} onValueChange={(v) => setZoom(Number(v))}>
                <SelectTrigger className="w-24 h-9 border-none bg-white shadow-sm font-black text-[10px] rounded-xl focus:ring-indigo-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-200 rounded-xl overflow-hidden shadow-2xl">
                  {[50, 75, 100, 125, 150, 200].map(z => (
                    <SelectItem key={z} value={String(z)} className="text-[10px] font-bold py-2 focus:bg-indigo-50 focus:text-indigo-700">{z}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator orientation="vertical" className="h-8 bg-slate-200" />

            <div className="flex gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={previewMode ? "default" : "ghost"}
                      onClick={() => setPreviewMode(!previewMode)}
                      className={`h-11 w-11 p-0 rounded-2xl transition-all duration-300 ${previewMode ? 'bg-indigo-600 shadow-lg shadow-indigo-200 text-white' : 'text-slate-400 bg-white shadow-sm border border-slate-100 hover:border-indigo-100 hover:text-indigo-600'}`}
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 border-none rounded-lg text-[10px] uppercase font-bold tracking-widest text-white px-3 py-2">Toggle Vision Simulation</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="ghost" className="h-11 px-6 bg-white shadow-sm text-slate-700 hover:bg-slate-50 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-slate-100 transition-all hover:scale-105 active:scale-95" onClick={onCancel}>
                Abort
              </Button>
              <Button className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 group" onClick={() => onSave(elements, { width: parseFloat(String(width)) || 100, height: parseFloat(String(height)) || 60 })}>
                Commit Build
                <ChevronRightIcon className="h-3.5 w-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

        {/* The Designer Workspace */}
        <div className="flex-1 overflow-auto bg-[#f1f5f9] flex items-center justify-center p-20 scrollbar-hide relative">
          {/* Subtle Grid Pattern for Workspace */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div
            className="flex items-center justify-center transition-all duration-500 ease-out p-12"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center'
            }}
          >
            <div
              ref={canvasRef}
              className={`bg-white shadow-[0_30px_90px_rgba(0,0,0,0.08)] relative overflow-hidden transition-all duration-300 ${previewMode ? '' : 'ring-1 ring-slate-200'}`}
              style={{
                width: templateWidth,
                height: templateHeight,
                cursor: tool === 'select' ? 'default' : 'crosshair',
                boxSizing: 'content-box'
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
            >
              {/* Internal Workspace Grid */}
              {showGrid && !previewMode && (
                <div
                  className="absolute inset-0 pointer-events-none z-0 opacity-10"
                  style={{
                    backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`,
                    backgroundSize: `${gridSize}px ${gridSize}px`
                  }}
                />
              )}

              {/* Element Synthesis Engine */}
              {[...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map((el) => {
                const isSelected = selectedElement === el.id && !previewMode;

                return (
                  <div
                    key={el.id}
                    className={`absolute select-none transition-shadow group/element ${isSelected ? 'z-[100]' : ''}`}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      padding: `${el.paddingTop || 0}px ${el.paddingRight || 0}px ${el.paddingBottom || 0}px ${el.paddingLeft || 0}px`,
                      margin: `${el.marginTop || 0}px ${el.marginRight || 0}px ${el.marginBottom || 0}px ${el.marginLeft || 0}px`,
                      cursor: isSelected ? 'move' : 'pointer',
                      zIndex: el.zIndex,
                    }}
                    onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Element Component */}
                    <div className={`w-full h-full relative ${isSelected ? 'ring-2 ring-indigo-500 shadow-2xl shadow-indigo-200' : ''}`}
                      style={{
                        backgroundColor: el.backgroundColor,
                        borderStyle: el.borderStyle,
                        borderWidth: `${el.borderWidth}px`,
                        borderColor: el.borderColor,
                        borderRadius: `${el.borderRadius || 0}px`,
                        opacity: el.opacity,
                        transform: `rotate(${el.rotation}deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        padding: '4px',
                        overflow: 'hidden'
                      }}
                    >
                      {el.type === 'image' ? (
                        el.content ? (
                          <img src={el.content} alt="" className="max-w-full max-h-full object-contain pointer-events-none" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4">
                            <ImageIcon className="h-8 w-8 text-slate-300" />
                            <span className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">Empty Vector</span>
                          </div>
                        )
                      ) : el.type === 'barcode' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 opacity-90 transition-opacity hover:opacity-100">
                          <BarcodePreview content={resolveContent(el.content)} width={el.width} height={el.height} />
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: `${el.fontSize}px`,
                            fontWeight: el.fontWeight,
                            fontStyle: el.fontStyle,
                            textDecoration: el.textDecoration,
                            textAlign: el.textAlign as any,
                            color: el.color,
                            fontFamily: el.fontFamily || 'inherit',
                            width: '100%',
                            wordBreak: 'break-word',
                            lineHeight: el.lineHeight || 1.1,
                            letterSpacing: `${el.letterSpacing || 0}px`,
                          }}
                        >
                          {resolveContent(el.content) || (isSelected ? 'Enter data...' : '')}
                        </div>
                      )}

                      {/* Selection High-Fidelity HUD */}
                      {isSelected && (
                        <>
                          {/* Label Type Indicator */}
                          <div className="absolute -top-10 left-0 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
                            <LayersIcon className="h-2.5 w-2.5" /> {el.type} Vector
                          </div>

                          {/* Action Hub */}
                          <div className="absolute -top-10 right-0 flex gap-2 animate-in slide-in-from-bottom-2">
                            <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-white shadow-lg text-slate-400 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); duplicateElement(el.id); }}>
                              <CopyIcon className="h-3 w-3" />
                            </Button>
                            <Button variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-lg" onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}>
                              <Trash2Icon className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Designer Dimensions HUD */}
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-2xl animate-in fade-in zoom-in duration-300">
                            {Math.round(el.width)}px × {Math.round(el.height)}px Matrix
                          </div>

                          {/* High-Performance Scaling Handles */}
                          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(dir => (
                            <div
                              key={dir}
                              className={`absolute w-4 h-4 rounded-full border-2 border-indigo-500 bg-white shadow-lg transition-transform hover:scale-150 z-50
                                ${dir === 'n' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize' : ''}
                                ${dir === 's' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize' : ''}
                                ${dir === 'e' ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize' : ''}
                                ${dir === 'w' ? 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize' : ''}
                                ${dir === 'nw' ? 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' : ''}
                                ${dir === 'ne' ? 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' : ''}
                                ${dir === 'se' ? 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize' : ''}
                                ${dir === 'sw' ? 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize' : ''}
                              `}
                              onMouseDown={(e) => handleResizeMouseDown(e, el.id, dir)}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Designer HUD Overlay */}
        {!previewMode && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-[2rem] shadow-2xl flex items-center gap-8 z-40 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Engine Optimized</span>
            </div>
            <Separator orientation="vertical" className="h-4 bg-white/20" />
            <div className="flex items-center gap-4 text-white/60 text-[10px] uppercase font-black tracking-widest">
              <span>Magnification: {zoom}%</span>
              <span>Coordinates: {selectedEl ? `${Math.round(selectedEl.x)}, ${Math.round(selectedEl.y)}` : 'Wait-state'}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}