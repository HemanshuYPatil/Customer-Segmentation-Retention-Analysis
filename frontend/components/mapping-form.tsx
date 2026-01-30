"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { requiredFields, optionalFields } from "@/lib/mapping";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/services/api";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

type Mapping = Record<string, string>;

export default function MappingForm() {
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileRef, setFileRef] = useState<File | null>(null);
  const [datasetLabel, setDatasetLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressTimer = useRef<number | null>(null);
  const { push } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const parseFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
    const headers = (data[0] || []).map((h) => String(h)).filter(Boolean);
    setColumns(headers);
  }, []);

  const onDrop = async (file: File) => {
    setFileName(file.name);
    setFileRef(file);
    setUploading(true);
    setUploadProgress(0);
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
    }
    progressTimer.current = window.setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 8 : prev));
    }, 120);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await parseFile(file);
    setUploadProgress(100);
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    setTimeout(() => setUploading(false), 250);
  };

  const onInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onDrop(file);
  };

  const updateMapping = (key: string, value: string) => {
    setMapping((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = requiredFields.every((field) => mapping[field.key]);

  const resetUpload = () => {
    setFileName(null);
    setFileRef(null);
    setColumns([]);
    setMapping({});
    setUploading(false);
    setUploadProgress(0);
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const selectedValues = useMemo(
    () => new Set(Object.values(mapping).filter(Boolean)),
    [mapping]
  );

  const getOptions = useCallback(
    (fieldKey: string) => {
      const current = mapping[fieldKey];
      return columns.filter((col) => col === current || !selectedValues.has(col));
    },
    [columns, mapping, selectedValues]
  );

  const handleTrain = async () => {
    if (!canSubmit) {
      push({
        title: "Complete required mapping.",
        description: "Map all required fields before training.",
        tone: "error"
      });
      return;
    }
    if (!fileRef) {
      push({
        title: "Upload a dataset.",
        description: "Select a CSV or Excel file to continue.",
        tone: "error"
      });
      return;
    }
    if (!user) {
      push({ title: "Login required.", description: "Sign in to train a model.", tone: "error" });
      return;
    }
    setLoading(true);
    try {
      const upload = await api.uploadDataset(user.uid, fileRef, mapping);
      await api.retrain({
        tenant_id: user.uid,
        dataset_path: upload.dataset_path,
        mapping_path: upload.mapping_path,
        notify_email: user.email
      });
      const pending = JSON.parse(
        window.localStorage.getItem("pending-models") ?? "[]"
      ) as Array<{ tempId: string; name: string; createdAt: number }>;
      const safeName = datasetLabel?.trim() || "New model";
      const next = [
        { tempId: `queued-${Date.now()}`, name: safeName, createdAt: Date.now() },
        ...pending
      ];
      window.localStorage.setItem("pending-models", JSON.stringify(next));
      push({
        title: "Training queued.",
        description: "We will email you when the model is ready.",
        tone: "success"
      });
      router.push("/models");
    } catch (err) {
      push({
        title: "Training failed.",
        description: "Check the API connection and try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await onDrop(file);
  };

  return (
    <Card>
      <div className="flex flex-col gap-2">
        <CardTitle>Upload Dataset</CardTitle>
        <CardDescription>
          Upload a CSV/Excel file, name the dataset, then map your columns.
        </CardDescription>
      </div>

      <div className="mt-5 space-y-5">
        <div className="rounded-xl border border-panelBorder bg-background p-4">
          <p className="text-sm font-semibold">Dataset label</p>
          <p className="mt-1 text-xs text-muted">
            Provide a label to identify this dataset or model in your workspace.
          </p>
          <div className="mt-3">
            <Input
              placeholder="e.g. Retail v3 - January upload"
              value={datasetLabel}
              onChange={(e) => setDatasetLabel(e.target.value)}
            />
          </div>
        </div>

        {!fileName ? (
          <div
            className="rounded-xl border border-dashed border-panelBorder bg-background p-8 text-center"
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
          >
            <p className="text-sm font-semibold">Upload dataset</p>
            <p className="mt-1 text-xs text-muted">Drag & drop CSV/XLSX, or browse to upload.</p>
            <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-md border border-panelBorder px-4 py-2 text-sm">
              Choose file
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onInputChange} />
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-panelBorder bg-background px-4 py-3">
            <div>
              <p className="text-xs uppercase text-muted">Uploaded file</p>
              <p className="text-sm font-semibold text-text">{fileName}</p>
              {uploading && (
                <div className="mt-2">
                  <div className="h-1.5 w-48 overflow-hidden rounded-full bg-panelBorder/60">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">Processing file...</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={resetUpload}
              aria-label="Remove file"
              disabled={uploading}
            >
              <X size={16} />
            </Button>
          </div>
        )}

        {fileName && !uploading && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-panelBorder bg-panel p-4">
              <p className="text-sm font-semibold">Required fields</p>
              <div className="mt-3 grid gap-3">
                {requiredFields.map((field) => (
                  <div key={field.key} className="grid gap-2 md:grid-cols-[1fr_1.2fr]">
                    <span className="text-xs text-muted">{field.label}</span>
                    <Select
                      value={mapping[field.key] ?? ""}
                      onChange={(e) => updateMapping(field.key, e.target.value)}
                    >
                      <option value="">Select column</option>
                      {getOptions(field.key).map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-panelBorder bg-panel p-4">
              <p className="text-sm font-semibold">Optional fields</p>
              <div className="mt-3 grid gap-3">
                {optionalFields.map((field) => (
                  <div key={field.key} className="grid gap-2 md:grid-cols-[1fr_1.2fr]">
                    <span className="text-xs text-muted">{field.label}</span>
                    <Select
                      value={mapping[field.key] ?? ""}
                      onChange={(e) => updateMapping(field.key, e.target.value)}
                    >
                      <option value="">Select column</option>
                      {getOptions(field.key).map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-panelBorder bg-background p-4 lg:col-span-2">
              <div>
                <p className="text-sm font-semibold">Train model</p>
                <p className="text-xs text-muted">We will validate your mapping and start training.</p>
              </div>
              <Button onClick={handleTrain} disabled={loading} loading={loading}>
                Train Model
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
