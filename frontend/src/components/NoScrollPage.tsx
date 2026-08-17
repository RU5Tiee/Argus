import React from "react";

interface NoScrollPageProps {
  title: string;
  gridTemplate?: string; // Optional custom grid-template-columns/rows
  children: React.ReactNode;
}

export const NoScrollPage: React.FC<NoScrollPageProps> = ({
  title,
  gridTemplate = "1fr",
  children,
}) => {
  return (
    <div className="no-scroll-container">
      {/* Header bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "12px",
        }}
      >
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            display: "flex",
            gap: "16px",
            alignItems: "center",
          }}
        >
          <span>SYSTEM STATE: ACTIVE</span>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--color-flow-cyan)",
              boxShadow: "0 0 8px var(--color-flow-cyan)",
            }}
          />
        </div>
      </header>

      {/* Grid Content Panel */}
      <main
        className="no-scroll-content"
        style={{
          gridTemplate: gridTemplate,
        }}
      >
        {children}
      </main>
    </div>
  );
};
