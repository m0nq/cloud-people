import { useState, useCallback, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Connection {
  id: string;
  startId: string;
  endId: string;
  startPoint: Point;
  endPoint: Point;
  style?: {
    color?: string;
    width?: number;
    dashArray?: string;
  };
  label?: string;
}

interface ConnectionObject {
  id: string;
  element: HTMLElement;
  position: Point;
}

export const useConnections = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<Partial<Connection> | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const objectsRef = useRef<Map<string, ConnectionObject>>(new Map());

  const registerObject = useCallback((id: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    objectsRef.current.set(id, {
      id,
      element,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    });
  }, []);

  const unregisterObject = useCallback((id: string) => {
    objectsRef.current.delete(id);
    // Remove any connections involving this object
    setConnections(prev => prev.filter(conn => 
      conn.startId !== id && conn.endId !== id
    ));
  }, []);

  const startConnection = useCallback((id: string, event: React.MouseEvent) => {
    const object = objectsRef.current.get(id);
    if (!object) return;

    setIsConnecting(true);
    setActiveConnection({
      startId: id,
      startPoint: object.position,
      endPoint: {
        x: event.clientX,
        y: event.clientY
      }
    });
  }, []);

  const updateConnection = useCallback((event: React.MouseEvent) => {
    if (!isConnecting || !activeConnection) return;

    setActiveConnection(prev => prev ? {
      ...prev,
      endPoint: {
        x: event.clientX,
        y: event.clientY
      }
    } : null);
  }, [isConnecting, activeConnection]);

  const finishConnection = useCallback((endId: string) => {
    if (!isConnecting || !activeConnection || !activeConnection.startId) return;

    const endObject = objectsRef.current.get(endId);
    if (!endObject || endObject.id === activeConnection.startId) {
      cancelConnection();
      return;
    }

    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      startId: activeConnection.startId,
      endId: endObject.id,
      startPoint: activeConnection.startPoint!,
      endPoint: endObject.position,
      style: {
        color: '#6366f1',
        width: 2,
        dashArray: ''
      }
    };

    setConnections(prev => [...prev, newConnection]);
    setIsConnecting(false);
    setActiveConnection(null);
  }, [isConnecting, activeConnection]);

  const cancelConnection = useCallback(() => {
    setIsConnecting(false);
    setActiveConnection(null);
  }, []);

  const updateConnectionStyle = useCallback((connectionId: string, style: Connection['style']) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId ? { ...conn, style: { ...conn.style, ...style } } : conn
    ));
  }, []);

  const updateConnectionLabel = useCallback((connectionId: string, label: string) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId ? { ...conn, label } : conn
    ));
  }, []);

  const deleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  const updateObjectPositions = useCallback(() => {
    objectsRef.current.forEach((obj, id) => {
      const rect = obj.element.getBoundingClientRect();
      obj.position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    });

    setConnections(prev => prev.map(conn => ({
      ...conn,
      startPoint: objectsRef.current.get(conn.startId)?.position || conn.startPoint,
      endPoint: objectsRef.current.get(conn.endId)?.position || conn.endPoint
    })));
  }, []);

  return {
    connections,
    activeConnection,
    isConnecting,
    registerObject,
    unregisterObject,
    startConnection,
    updateConnection,
    finishConnection,
    cancelConnection,
    updateConnectionStyle,
    updateConnectionLabel,
    deleteConnection,
    updateObjectPositions
  };
};