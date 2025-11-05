import { useState, useCallback } from 'react';

interface PanOffset {
  x: number;
  y: number;
}

interface DragStart {
  x: number;
  y: number;
}

interface UseVisualizationInteractionReturn {
  panOffset: PanOffset;
  setPanOffset: (offset: PanOffset | ((prev: PanOffset) => PanOffset)) => void;
  isDragging: boolean;
  dragStart: DragStart;
  handleWheel: (e: WheelEvent, zoomLevel: number, setZoomLevel: (level: number) => void) => void;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>, zoomLevel: number, panOffset: PanOffset) => { isDragging: boolean; dragStart: DragStart };
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>, isDragging: boolean, dragStart: DragStart, panOffset: PanOffset, zoomLevel: number, svgSize: number) => PanOffset;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
}

export const useVisualizationInteraction = (): UseVisualizationInteractionReturn => {
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragStart>({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: WheelEvent, zoomLevel: number, setZoomLevel: (level: number) => void): void => {
      e.preventDefault();
      const delta = e.deltaY;
      const zoomSpeed = 0.1;

      const newZoom = zoomLevel * (1 + (delta > 0 ? -zoomSpeed : zoomSpeed));
      const clampedZoom = Math.max(1, Math.min(40, newZoom));

      setZoomLevel(clampedZoom);
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, zoomLevel: number, currentPanOffset: PanOffset): { isDragging: boolean; dragStart: DragStart } => {
      if (zoomLevel > 1.1) {
        setIsDragging(true);
        const newDragStart = {
          x: e.clientX - currentPanOffset.x,
          y: e.clientY - currentPanOffset.y
        };
        setDragStart(newDragStart);
        return { isDragging: true, dragStart: newDragStart };
      }
      return { isDragging: false, dragStart };
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, isDraggingState: boolean, currentDragStart: DragStart, currentPanOffset: PanOffset, zoomLevel: number, svgSize: number): PanOffset => {
      if (isDraggingState) {
        const dx = e.clientX - currentDragStart.x;
        const dy = e.clientY - currentDragStart.y;

        const maxPan = (zoomLevel - 1) * svgSize / 2;
        const newX = Math.max(-maxPan, Math.min(maxPan, dx));
        const newY = Math.max(-maxPan, Math.min(maxPan, dy));

        const newPanOffset = { x: newX, y: newY };
        setPanOffset(newPanOffset);
        return newPanOffset;
      }
      return currentPanOffset;
    },
    []
  );

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback((): void => {
    setIsDragging(false);
  }, []);

  return {
    panOffset,
    setPanOffset,
    isDragging,
    dragStart,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave
  };
};
