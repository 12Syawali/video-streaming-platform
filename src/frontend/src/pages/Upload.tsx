import { SignInButton } from "@/components/InternetIdentity";
import { useCreateVideo } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { CategoryEnum } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Film,
  Gamepad2,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ACCEPT_ATTR = "video/mp4,video/webm,video/quicktime";
const MAX_BYTES = 200 * 1024 * 1024;

const CATEGORY_OPTIONS = [
  {
    value: CategoryEnum.game,
    label: "Gaming",
    hint: "Gameplay, streams, highlights",
    icon: Gamepad2,
  },
  {
    value: CategoryEnum.entertainment,
    label: "Entertainment",
    hint: "Vlogs, music, comedy, film",
    icon: Sparkles,
  },
] as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SignedOutPrompt() {
  return (
    <section
      data-ocid="upload.signed_out_state"
      aria-label="Sign in to upload"
      className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card px-6 py-14 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/12 text-primary">
        <UploadCloud className="size-7" aria-hidden="true" />
      </span>
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Sign in to upload
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Publish your videos to VELOCITY. Sign in with Internet Identity to
          start uploading.
        </p>
      </div>
      <SignInButton className="rounded-full bg-gradient-primary px-6 py-3 font-display text-sm font-semibold text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60" />
    </section>
  );
}

export default function UploadPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const authenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const navigate = useNavigate();
  const createVideo = useCreateVideo();

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryEnum>(CategoryEnum.game);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    file?: string;
    submit?: string;
  }>({});
  const [published, setPublished] = useState(false);

  if (isInitializing) {
    return (
      <output
        data-ocid="upload.loading_state"
        className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading your session…
      </output>
    );
  }

  if (!authenticated) {
    return <SignedOutPrompt />;
  }

  const isUploading = createVideo.isPending;

  function pickFile(next: File | null) {
    if (!next) return;
    if (!ACCEPTED_TYPES.includes(next.type)) {
      setFile(null);
      setErrors((prev) => ({
        ...prev,
        file: "Unsupported file type. Use MP4, WebM or MOV.",
      }));
      return;
    }
    if (next.size > MAX_BYTES) {
      setFile(null);
      setErrors((prev) => ({
        ...prev,
        file: `File is too large. Keep it under ${formatBytes(MAX_BYTES)}.`,
      }));
      return;
    }
    setFile(next);
    setErrors((prev) => ({ ...prev, file: undefined, submit: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const nextErrors: { title?: string; file?: string } = {};
    if (!trimmedTitle) nextErrors.title = "Add a title for your video.";
    if (!file) nextErrors.file = "Choose a video file to upload.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!file) return;

    setErrors({});
    setProgress(0);
    const capturedFile = file;
    const capturedTitle = trimmedTitle;
    const capturedDescription = description.trim();
    const capturedCategory = category;

    void (async () => {
      try {
        const bytes = new Uint8Array(await capturedFile.arrayBuffer());
        const blob = ExternalBlob.fromBytes(
          bytes,
          capturedFile.type,
          capturedFile.name,
        ).withUploadProgress((pct) => setProgress(Math.round(pct)));

        const created = await createVideo.mutateAsync({
          title: capturedTitle,
          description: capturedDescription,
          videoFile: blob.getDirectURL(),
          thumbnail: blob.getDirectURL(),
          category: capturedCategory,
        });

        setPublished(true);
        setFile(null);
        setTitle("");
        setDescription("");
        setProgress(0);
        void navigate({
          to: "/watch/$videoId",
          params: { videoId: created.id.toString() },
        });
      } catch {
        setErrors((prev) => ({
          ...prev,
          submit: "Upload failed. Check your connection and try again.",
        }));
      }
    })();
  }

  return (
    <section
      data-ocid="upload.page"
      aria-label="Upload a video"
      className="space-y-6"
    >
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Upload a video
        </h1>
        <p className="text-sm text-muted-foreground">
          Share your gameplay or entertainment with the VELOCITY community.
        </p>
      </header>

      {published && (
        <output
          data-ocid="upload.success_state"
          className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-foreground"
        >
          <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
          Published! Taking you to your video…
        </output>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* File picker */}
        <div className="space-y-2">
          <span className="font-display text-sm font-medium text-foreground">
            Video file
          </span>
          {file ? (
            <div
              data-ocid="upload.file_preview"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Film className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                data-ocid="upload.remove_file_button"
                aria-label="Remove selected file"
                disabled={isUploading}
                onClick={() => {
                  setFile(null);
                  setProgress(0);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-ocid="upload.dropzone"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                pickFile(event.dataTransfer.files?.[0] ?? null);
              }}
              className={cn(
                "flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
                dragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/60 hover:bg-secondary/40",
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                <UploadCloud className="size-6" aria-hidden="true" />
              </span>
              <span className="font-display text-sm font-semibold text-foreground">
                Drag &amp; drop or click to browse
              </span>
              <span className="text-xs text-muted-foreground">
                MP4, WebM or MOV · up to {formatBytes(MAX_BYTES)}
              </span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            data-ocid="upload.file_input"
            className="sr-only"
            onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
          />
          {errors.file && (
            <p
              data-ocid="upload.file_error"
              role="alert"
              className="flex items-center gap-1.5 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5" aria-hidden="true" />
              {errors.file}
            </p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label
            htmlFor="upload-title"
            className="font-display text-sm font-medium text-foreground"
          >
            Title
          </label>
          <input
            id="upload-title"
            type="text"
            value={title}
            maxLength={120}
            data-ocid="upload.title_input"
            placeholder="Give your video a title"
            disabled={isUploading}
            onChange={(event) => {
              setTitle(event.target.value);
              if (errors.title)
                setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            className={cn(
              "w-full rounded-xl border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
              errors.title ? "border-destructive" : "border-input",
            )}
          />
          {errors.title && (
            <p
              data-ocid="upload.title_error"
              role="alert"
              className="flex items-center gap-1.5 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5" aria-hidden="true" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="upload-description"
            className="font-display text-sm font-medium text-foreground"
          >
            Description{" "}
            <span className="font-body text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <textarea
            id="upload-description"
            value={description}
            rows={4}
            maxLength={2000}
            data-ocid="upload.description_textarea"
            placeholder="Tell viewers what your video is about"
            disabled={isUploading}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
          />
        </div>

        {/* Category */}
        <fieldset className="space-y-2" disabled={isUploading}>
          <legend className="font-display text-sm font-medium text-foreground">
            Category
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = category === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-ocid={`upload.category.${option.value}`}
                  aria-pressed={selected}
                  onClick={() => setCategory(option.value)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50 hover:bg-secondary/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="font-display text-sm font-semibold text-foreground">
                    {option.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Progress */}
        {isUploading && (
          <div data-ocid="upload.progress" className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Uploading…</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-primary transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {errors.submit && (
          <p
            data-ocid="upload.error_state"
            role="alert"
            className="flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
          >
            <AlertCircle
              className="size-4 text-destructive"
              aria-hidden="true"
            />
            {errors.submit}
          </p>
        )}

        <button
          type="submit"
          data-ocid="upload.submit_button"
          disabled={isUploading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3.5 font-display text-sm font-semibold text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Publishing…
            </>
          ) : (
            <>
              <UploadCloud className="size-4" aria-hidden="true" />
              Publish video
            </>
          )}
        </button>
      </form>
    </section>
  );
}
