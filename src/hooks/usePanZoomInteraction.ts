import { useCallback, useState } from 'react';

interface PanZoomState {
  panOffset: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
  zoomLevel: number;
}

interface PanZoomHandlers {
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  handleWheel: (e: WheelEvent) => void;
}

export const usePanZoomInteraction = (
  svgSize: number,
  onPanChange: (pan: { x: number; y: number }) => void,
  onZoomChange: (zoom: number) => void,
  zoomLevel: number
): PanZoomHandlers & PanZoomState => {
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    if (zoomLevel > 1.1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
    }
  }, [zoomLevel, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      const maxPan = (zoomLevel - 1) * svgSize / 2;
      const newX = Math.max(-maxPan, Math.min(maxPan, dx));
      const newY = Math.max(-maxPan, Math.min(maxPan, dy));

      setPanOffset({ x: newX, y: newY });
      onPanChange({ x: newX, y: newY });
    }
  }, [isDragging, dragStart, zoomLevel, svgSize, onPanChange]);

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback((): void => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: WheelEvent): void => {
    e.preventDefault();

    const delta = e.deltaY;
    const zoomSensitivity = 0.01;
    const newZoom = Math.max(1, Math.min(20, zoomLevel + (delta > 0 ? -zoomSensitivity : zoomSensitivity)));

    onZoomChange(newZoom);
  }, [zoomLevel, onZoomChange]);

  return {
    panOffset,
    isDragging,
    dragStart,
    zoomLevel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel
  };
};
