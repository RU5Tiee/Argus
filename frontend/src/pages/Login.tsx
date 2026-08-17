import React, { useState } from "react";

interface LoginProps {
  onLoginSuccess: (token: string, role: string, username: string, name: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Attempt real API login
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        onLoginSuccess(data.access_token, data.role, data.username, data.user_name);
      } else {
        setError(data.detail?.message || "Invalid credentials provided.");
      }
    } catch (err) {
      console.warn("Backend offline, attempting mock control room authentication...");
      
      // 2. Local fallback if backend is offline
      const mockDb: Record<string, any> = {
        admin: { password: "adminpassword", role: "ADMINISTRATOR", name: "System Administrator (Level 3)" },
        operator: { password: "operatorpassword", role: "OPERATOR", name: "Control Room Operator (Level 2)" },
        auditor: { password: "auditorpassword", role: "AUDITOR", name: "Security Compliance Auditor (Read-Only)" }
      };

      const user = mockDb[username.toLowerCase()];
      if (user && user.password === password) {
        onLoginSuccess(`mock_token_${username}`, user.role, username, user.name);
      } else {
        setError("Network error: Backend server offline and mock credentials did not match.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "360px",
          padding: "32px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "0.05em", color: "var(--text-primary)" }}>
            ARGUS LOGIN
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Cyber-Physical System Deception HMI Gateway
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid var(--color-alarm-critical)",
              borderRadius: "3px",
              color: "var(--color-alarm-critical)",
              fontSize: "0.75rem",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "bold" }}>USERNAME</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              padding: "10px",
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              borderRadius: "3px",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "bold" }}>SECURITY KEY / PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "10px",
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              borderRadius: "3px",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "12px",
            backgroundColor: "var(--color-flow-cyan)",
            color: "var(--bg-primary)",
            border: "none",
            borderRadius: "3px",
            fontSize: "0.85rem",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          {isLoading ? "AUTHENTICATING..." : "ACCESS HMI SYSTEM"}
        </button>

        <div
          style={{
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            textAlign: "center",
            borderTop: "1px solid var(--border-color)",
            paddingTop: "12px",
            lineHeight: "1.4",
          }}
        >
          Level 2/3 SCADA HMI Secure Access Layer. All unauthorized access attempts will trigger an immediate Security Alarm.
        </div>
      </form>
    </div>
  );
};
