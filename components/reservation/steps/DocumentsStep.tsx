"use client";

import { type DragEvent, type ReactNode, useState } from "react";
import { ReservationActionContent } from "../ReservationActionContent";

export interface DocumentFiles {
  governmentId: File | null;
  utilityBill: File | null;
}

interface DocumentsStepProps {
  files: DocumentFiles;
  onChange(files: DocumentFiles): void;
  onBack(): void;
  onProceed(): void;
  loading: boolean;
}

interface UploadFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint: string;
  file: File | null;
  error: string | null;
  onFile(file: File | null): void;
  onError(error: string | null): void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function validateFile(file: File) {
  const supportedExtension = /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!ACCEPTED_TYPES.includes(file.type) && !supportedExtension) return "Upload an image or PDF file.";
  if (file.size > MAX_FILE_SIZE) return "The file must be 10 MB or smaller.";
  return null;
}

function UploadField({ id, label, required, hint, file, error, onFile, onError }: UploadFieldProps) {
  const [dragging, setDragging] = useState(false);

  const chooseFile = (nextFile: File | undefined) => {
    if (!nextFile) return;
    const nextError = validateFile(nextFile);
    onError(nextError);
    if (!nextError) onFile(nextFile);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  let content: ReactNode;
  if (file) {
    content = (
      <>
        <span className="document-upload-icon uploaded" aria-hidden="true">
          ✓
        </span>
        <span className="document-upload-copy">
          <strong title={file.name}>{file.name}</strong>
          <small>
            Uploaded ·{" "}
            <button
              type="button"
              onClick={() => {
                onFile(null);
                onError(null);
              }}
            >
              Remove
            </button>
          </small>
        </span>
      </>
    );
  } else {
    content = (
      <>
        <span className="document-upload-icon" aria-hidden="true">
          ↓
        </span>
        <span className="document-upload-copy">
          <strong>
            Drag a file here or <label htmlFor={id}>browse</label>
          </strong>
          <small>{hint}</small>
        </span>
      </>
    );
  }

  return (
    <div className="document-field">
      <label className="document-field-label" htmlFor={id}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <div
        className={`document-upload${file ? " has-file" : ""}${dragging ? " is-dragging" : ""}${error ? " has-error" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.pdf"
          onChange={(event) => {
            chooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {content}
      </div>
      {error && <small className="document-error">{error}</small>}
    </div>
  );
}

export function DocumentsStep({ loading, files, onChange, onBack, onProceed }: DocumentsStepProps) {
  const [errors, setErrors] = useState<{ governmentId: string | null; utilityBill: string | null }>({ governmentId: null, utilityBill: null });
  const complete = Boolean(files.governmentId && files.utilityBill && !errors.governmentId && !errors.utilityBill);

  return (
    <div className="reservation-step">
      <header className="reservation-step-header">
        <p>
          Step 7 of 7 <span aria-hidden="true">·</span> Documents
        </p>
      </header>

      <div className="reservation-step-scroll documents-step-scroll">
        <section className="documents-step-intro">
          <h2>Upload your documents</h2>
          <p>Upload images or PDF files up to 10 MB each. We will use these documents for identity verification only.</p>
        </section>

        <div className="document-fields">
          <UploadField
            id="government-id"
            label="Government ID"
            required
            hint="Passport, national ID or driver licence"
            file={files.governmentId}
            error={errors.governmentId}
            onFile={(governmentId) => onChange({ ...files, governmentId })}
            onError={(governmentId) => setErrors((current) => ({ ...current, governmentId }))}
          />
          <UploadField
            id="utility-bill"
            label="Proof of residence"
            required
            hint="Dated within the last three months"
            file={files.utilityBill}
            error={errors.utilityBill}
            onFile={(utilityBill) => onChange({ ...files, utilityBill })}
            onError={(utilityBill) => setErrors((current) => ({ ...current, utilityBill }))}
          />
        </div>
      </div>

      <footer className="reservation-step-actions">
        <button type="button" className="secondary-action" onClick={onBack}>
          Back
        </button>
        <button type="button" className="continue-action" disabled={!complete || loading} aria-busy={loading} onClick={onProceed}>
          <ReservationActionContent loading={loading} label="Proceed" loadingLabel="Uploading..." />
        </button>
      </footer>
    </div>
  );
}
