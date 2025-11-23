"use client";

import { cn } from "@/lib/utils";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  Eye,
  FileIcon,
  Loader2,
  Trash2,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { type DropzoneOptions } from "react-dropzone";
import { Dropzone } from "./dropzone";
import { ProgressBar } from "./progress-bar";
import { formatFileSize, useUploader } from "./uploader-provider";
import { Button } from "../ui/button";
import { toast } from "sonner";

/**
 * Displays a list of files with their upload status, progress, and controls.
 *
 * @component
 * @example
 * ```tsx
 * <FileList className="my-4" />
 * ```
 */
interface ChildProps {
  onDelete: (url: string) => Promise<{ success: boolean }>;
}

const FileList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & ChildProps
>(({ className, onDelete, ...props }, ref) => {
  const { fileStates, removeFile, cancelUpload } = useUploader();

  const [isDeletingMap, setIsDeletingMap] = React.useState<
    Record<string, boolean>
  >({});

  if (!fileStates.length) return null;

  const handleDelete = async (url: string, key: string) => {
    setIsDeletingMap((prev) => ({ ...prev, [key]: true }));

    const result = await onDelete(url || "");

    setIsDeletingMap((prev) => ({ ...prev, [key]: false }));
    if (result.success) {
      removeFile(key);
      toast.success("Gỡ file thành công.");
    } else {
      toast.error("Gỡ file thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div
      ref={ref}
      className={cn("mt-3 flex w-full flex-col gap-2", className)}
      {...props}>
      {fileStates.map(
        ({ file, abortController, progress, status, key, url }) => {
          return (
            <div
              key={key}
              className="shadow-xs flex flex-col justify-center rounded border border-border px-4 py-3">
              <div className="flex items-center gap-3 text-foreground">
                <FileIcon className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs w-full">
                    <div className="text-sm min-w-0 flex-1">
                      <div className="overflow-hidden max-w-64 line-clamp-1 font-medium">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                    </div>

                    <div className="ml-2 flex items-center gap-2">
                      {status === "ERROR" && (
                        <div className="flex items-center text-xs text-destructive">
                          <AlertCircleIcon className="mr-1 h-4 w-4" />
                        </div>
                      )}

                      {status === "UPLOADING" && (
                        <div className="flex flex-col items-end">
                          {abortController && (
                            <button
                              type="button"
                              className="rounded-md p-0.5 transition-colors duration-200 hover:bg-secondary"
                              disabled={progress === 100}
                              onClick={() => {
                                cancelUpload(key);
                              }}>
                              <XIcon className="block h-4 w-4 shrink-0 text-muted-foreground" />
                            </button>
                          )}
                          <div>{Math.round(progress)}%</div>
                        </div>
                      )}

                      {status !== "UPLOADING" && status !== "COMPLETE" && (
                        <button
                          type="button"
                          className="rounded-md p-1 text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-destructive"
                          onClick={() => {
                            removeFile(key);
                          }}
                          title="Remove">
                          <Trash2Icon className="block h-4 w-4 shrink-0" />
                        </button>
                      )}

                      {status === "COMPLETE" && (
                        <div className="flex items-center gap-6">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => handleDelete(url || "", key)}
                            disabled={isDeletingMap[key]}>
                            {isDeletingMap[key] ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Trash2 />
                            )}
                          </Button>

                          <a href={url || ""} target="_blank">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm">
                              <Eye className="block size-4 shrink-0" />
                            </Button>
                          </a>

                          <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {status === "UPLOADING" && <ProgressBar progress={progress} />}
            </div>
          );
        }
      )}
    </div>
  );
});
FileList.displayName = "FileList";

/**
 * Props for the FileUploader component.
 *
 * @interface FileUploaderProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface FileUploaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum number of files allowed.
   */
  maxFiles?: number;

  /**
   * Maximum file size in bytes.
   */
  maxSize?: number;

  /**
   * Accepted file types.
   *
   * @example
   * ```tsx
   * accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
   * ```
   */
  accept?: DropzoneOptions["accept"];

  /**
   * Whether the uploader is disabled.
   */
  disabled?: boolean;

  /**
   * Additional className for the dropzone component.
   */
  dropzoneClassName?: string;

  /**
   * Additional className for the file list component.
   */
  fileListClassName?: string;

  /**
   * Ref for the input element inside the Dropzone.
   */
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * A complete file uploader component with dropzone and file list.
 *
 * @component
 * @example
 * ```tsx
 * <FileUploader
 *   maxFiles={5}
 *   maxSize={1024 * 1024 * 10} // 10MB
 *   accept={{ 'application/pdf': [] }}
 * />
 * ```
 */

const FileUploader = React.forwardRef<
  HTMLDivElement,
  FileUploaderProps & ChildProps
>(
  (
    {
      maxFiles,
      maxSize,
      accept,
      disabled,
      className,
      dropzoneClassName,
      fileListClassName,
      inputRef,
      onDelete,
      ...props
    },

    ref
  ) => {
    return (
      <div ref={ref} className={cn("w-full space-y-4", className)} {...props}>
        <Dropzone
          ref={inputRef}
          dropzoneOptions={{
            maxFiles,
            maxSize,
            accept,
          }}
          disabled={disabled}
          className={dropzoneClassName}
        />

        <FileList className={fileListClassName} onDelete={onDelete} />
      </div>
    );
  }
);
FileUploader.displayName = "FileUploader";

export { FileList, FileUploader };
