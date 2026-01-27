"use client";

import { useCallback, useState } from "react";
import * as XLSX from "xlsx";
import { requiredFields, optionalFields } from "@/lib/mapping";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { api } from "@/services/api";

type Mapping = Record<string, string>;

export default function MappingForm() {
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  const parseFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
    const headers = (data[0] || []).map((h) => String(h));
    setColumns(headers);
  }, []);

  const onDrop = async (file: File) => {
    setFileName(file.name);
    await parseFile(file);
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

  const handleRetrain = async () => {
    if (!canSubmit) {
      push({ title: "Map all required fields before retraining.", tone: "error" });
      return;
    }
    setLoading(true);
    try {
      await api.retrain();
      push({ title: "Retrain triggered successfully.", tone: "success" });
    } catch (err) {
      push({ title: "Retrain failed. Check API connection.", tone: "error" });
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
      <CardTitle>Self-Service Onboarding</CardTitle>
      <CardDescription>
        Upload a CSV/Excel file and map columns to the system schema.
      </CardDescription>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div
          className="rounded-lg border border-dashed border-panelBorder bg-background p-5 text-center"
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
        >
          <p className="text-sm text-muted">Drag & drop CSV/XLSX</p>
          <p className="mt-1 text-xs text-muted">or click to browse</p>
          <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-md border border-panelBorder px-4 py-2 text-sm">
            Upload file
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onInputChange} />
          </label>
          {fileName && <p className="mt-2 text-xs text-muted">Loaded: {fileName}</p>}
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Required</p>
            <div className="mt-2 grid gap-3">
              {requiredFields.map((field) => (
                <div key={field.key} className="grid grid-cols-2 gap-2">
                  <span className="text-xs text-muted">{field.label}</span>
                  <Select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => updateMapping(field.key, e.target.value)}
                  >
                    <option value="">Select column</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Optional</p>
            <div className="mt-2 grid gap-3">
              {optionalFields.map((field) => (
                <div key={field.key} className="grid grid-cols-2 gap-2">
                  <span className="text-xs text-muted">{field.label}</span>
                  <Select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => updateMapping(field.key, e.target.value)}
                  >
                    <option value="">Select column</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleRetrain} disabled={loading}>
            {loading ? "Retraining..." : "Retrain Model"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
