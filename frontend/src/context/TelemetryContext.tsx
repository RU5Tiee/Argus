import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import type { TelemetryPayload } from "../types/telemetry";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface TelemetryContextType {
  telemetry: TelemetryPayload | null;
  status: ConnectionStatus;
  reconnect: () => void;
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [authToken, setAuthTokenState] = useState<string | null>(localStorage.getItem("argus_token"));
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const setAuthToken = (token: string | null) => {
    setAuthTokenState(token);
    if (token) {
      localStorage.setItem("argus_token", token);
    } else {
      localStorage.removeItem("argus_token");
      localStorage.removeItem("argus_role");
      localStorage.removeItem("argus_username");
      localStorage.removeItem("argus_fullname");
    }
  };

  const connect = () => {
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.close();
    }

    setStatus("connecting");
    // Connect to backend WebSocket telemetry push stream
    const socket = new WebSocket("ws://localhost:8000/ws/telemetry");
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("connected");
      console.log("Telemetry WebSocket connected.");
    };

    socket.onmessage = (event) => {
      try {
        const payload: TelemetryPayload = JSON.parse(event.data);
        setTelemetry(payload);
      } catch (err) {
        console.error("Error parsing telemetry message payload:", err);
      }
    };

    socket.onclose = () => {
      setStatus("disconnected");
      console.log("Telemetry WebSocket closed. Retrying in 3 seconds...");
      // Auto-reconnect loop
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error("Telemetry WebSocket error:", error);
    };
  };

  useEffect(() => {
    // Only connect if user is authenticated (mock or real token)
    if (authToken) {
      connect();
    } else {
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
      }
      setTelemetry(null);
      setStatus("disconnected");
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
      }
    };
  }, [authToken]);

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        status,
        reconnect: connect,
        authToken,
        setAuthToken,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetry must be used within a TelemetryProvider");
  }
  return context;
};
