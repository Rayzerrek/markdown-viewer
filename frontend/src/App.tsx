import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { cn } from "@/lib/utils";
import {
  Moon,
  Sun,
  Monitor,
  FileText,
  Edit3,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Info,
  Upload,
  Trash2,
  FilePlus,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Theme = "light" | "dark" | "system";

type FileItem = {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

const STORAGE_KEY = "markdown-files";

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

function ToastIcon({ type }: { type: Toast["type"] }) {
  switch (type) {
    case "success":
      return <Check className="h-4 w-4" />;
    case "error":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-75 max-w-100 animate-in slide-in-from-right",
            t.type === "success" && "bg-green-600 text-white",
            t.type === "error" && "bg-red-600 text-white",
            t.type === "info" && "bg-primary text-white",
          )}
        >
          <ToastIcon type={t.type} />
          <span className="flex-1 text-sm">{t.message}</span>
          <Button
            onClick={() => onRemove(t.id)}
            variant="ghost"
            className="text-white hover:text-white/90 hover:bg-white/10 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    return stored ?? "system";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(systemDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  return [theme, setTheme] as const;
}

function ThemeToggle({
  theme,
  onThemeChange,
}: {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={theme === "light" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onThemeChange("light")}
        className="h-8 w-8"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "dark" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onThemeChange("dark")}
        className="h-8 w-8"
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "system" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onThemeChange("system")}
        className="h-8 w-8"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
}

function useFiles() {
  const [files, setFiles] = useState<FileItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as FileItem[];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    });
  }, [files]);

  const createFile = useCallback((name: string, content: string) => {
    const newFile: FileItem = {
      id: crypto.randomUUID(),
      name: name.endsWith(".md") ? name : `${name}.md`,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFiles((prev) => [newFile, ...prev]);
    return newFile.id;
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<FileItem>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f)),
    );
  }, []);

  const deleteFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const getFile = useCallback((id: string) => files.find((f) => f.id === id), [files]);

  return { files, createFile, updateFile, deleteFile, getFile, isPending };
}

function FileUploader({ onUpload }: { onUpload: (name: string, content: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      Array.from(fileList).forEach((file) => {
        if (file.type === "text/markdown" || file.name.endsWith(".md")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            onUpload(file.name, content);
          };
          reader.readAsText(file);
        }
      });
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
      )}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Drop markdown files here or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

function FileList({
  files,
  selectedId,
  onSelect,
  onDelete,
}: {
  files: FileItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No files yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {files.map((file) => (
        <div
          key={file.id}
          onClick={() => onSelect(file.id)}
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg cursor-pointer group",
            selectedId === file.id
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted text-foreground",
          )}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-sm truncate">{file.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file.id);
            }}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useTheme();
  const { toasts, addToast, removeToast } = useToast();
  const { files, createFile, updateFile, deleteFile, getFile } = useFiles();

  const selectedFile = useMemo(
    () => (selectedId ? getFile(selectedId) : null),
    [selectedId, getFile],
  );

  const handleCreateNew = useCallback(() => {
    const name = prompt("Enter file name:", "untitled.md");
    if (name) {
      const id = createFile(name, "# New File\n\nStart writing here...");
      setSelectedId(id);
      setIsEditing(true);
      addToast({ type: "success", message: "File created" });
    }
  }, [createFile, addToast]);

  const handleUpload = useCallback(
    (name: string, content: string) => {
      const id = createFile(name, content);
      setSelectedId(id);
      addToast({ type: "success", message: `Uploaded ${name}` });
    },
    [createFile, addToast],
  );

  const handleSave = useCallback(() => {
    if (!selectedId) return;
    updateFile(selectedId, { content: editableContent });
    setIsEditing(false);
    addToast({ type: "success", message: "File saved" });
  }, [selectedId, editableContent, updateFile, addToast]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteFile(id);
      if (selectedId === id) {
        setSelectedId(null);
        setIsEditing(false);
      }
      addToast({ type: "info", message: "File deleted" });
    },
    [deleteFile, selectedId, addToast],
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setIsEditing(false);
  }, []);

  const handleEdit = useCallback(() => {
    if (selectedFile) {
      setEditableContent(selectedFile.content);
      setIsEditing(true);
    }
  }, [selectedFile]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditableContent(selectedFile?.content ?? "");
  }, [selectedFile]);

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          "border-r bg-card transition-all duration-200 flex flex-col",
          isSidebarOpen ? "w-64" : "w-0 overflow-hidden",
        )}
      >
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Files</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateNew} className="flex-1" size="sm">
              <FilePlus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
          <FileUploader onUpload={handleUpload} />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <FileList
            files={files}
            selectedId={selectedId}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <h2 className="font-semibold truncate">{selectedFile?.name ?? "Select a file"}</h2>
            </div>

            <div className="flex items-center gap-2">
              {selectedFile &&
                (isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ))}
              <ThemeToggle theme={theme} onThemeChange={setTheme} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {selectedFile ? (
            isEditing ? (
              <textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="w-full min-h-[calc(100vh-8rem)] p-4 rounded-lg border bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                spellCheck={false}
              />
            ) : (
              <MarkdownViewer content={selectedFile.content} />
            )
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 mx-auto opacity-50" />
                <p>Select a file from the sidebar or create a new one</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
