"use client";

import { useState } from "react";
import Editor, { Issue } from "./components/Editor";

export default function Lint() {
  const [text, setText] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleLint = async (textToLint: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filter: "Info", text: textToLint }),
      });
      const data = await response.json();
      const fetchedIssues: Issue[] = data.issues.map((issue: any, index: number) => ({
        id: index,
        message: issue.message,
        severity: (issue.severity as string).toLowerCase() as Issue["severity"],
        start: issue.start,
        end: issue.end,
      }));
      setIssues(fetchedIssues);
    } catch (error) {
      console.error("Error linting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setIssues([]);
  };

  const handleCopyIssue = async (issue: Issue) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(issue, null, 2));
      setCopiedId(issue.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(issues, null, 2));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-73px)] bg-background overflow-hidden">
      {/* Main Editor Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? "blur-sm brightness-75 pointer-events-none" : ""
      }`}>
        <div className="flex-1 p-6 overflow-auto">
          <Editor
            value={text}
            onChange={setText}
            issues={issues}
          />
        </div>
      </div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-20 backdrop-blur-[2px]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-40 bg-card border border-border rounded-l-lg p-2 shadow-lg hover:bg-accent transition-all duration-300 ${
          isSidebarOpen ? "right-[400px]" : "right-0"
        }`}
        aria-label="Toggle sidebar"
      >
        <svg
          className={`w-5 h-5 text-foreground transition-transform duration-300 ${
            isSidebarOpen ? "rotate-0" : "rotate-180"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed right-0 h-screen bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out z-30 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "400px" }}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Analysis Results
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {issues.length} issues
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLint(text)}
                  className="px-3 py-1 rounded bg-accent text-accent-foreground border border-border hover:opacity-90 disabled:opacity-60 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Running…" : "Run"}
                </button>

                <button
                  onClick={handleClear}
                  className="px-3 py-1 rounded bg-muted text-muted-foreground border border-border hover:opacity-90 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Copy All Button */}
            {issues.length > 0 && (
              <button
                onClick={handleCopyAll}
                className="w-full mt-2 px-3 py-2 rounded bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {copiedAll ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy All as JSON
                  </>
                )}
              </button>
            )}
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {issues.length > 0 ? (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-lg border relative group ${
                      issue.severity === "error"
                        ? "bg-destructive/10 border-destructive/30"
                        : issue.severity === "warning"
                        ? "bg-warning/10 border-warning/30"
                        : "bg-primary/10 border-primary/30"
                    }`}
                  >
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyIssue(issue)}
                      className="absolute top-2 right-2 p-1.5 rounded bg-background/50 hover:bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy as JSON"
                    >
                      {copiedId === issue.id ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>

                    <div className="font-medium text-sm mb-1 capitalize pr-8">
                      {issue.severity}
                    </div>
                    <div className="text-sm text-foreground">
                      {issue.message}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Position: {issue.start}-{issue.end}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-muted-foreground text-sm">
                  No issues found yet
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  Use the Run button to analyze your text
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}