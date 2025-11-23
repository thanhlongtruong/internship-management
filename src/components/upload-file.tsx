import React, { memo, useCallback } from "react";

import {
  UploaderProvider,
  type UploadFn,
} from "@/components/upload/uploader-provider";

import { useEdgeStore } from "@/lib/edgestore";

import { FileUploader } from "@/components/upload/multi-file";

type UploadFileProps = {
  idAdvisorGroup: string;
  value?: {
    url: string;
    name: string;
  }[];
  onChange?: (
    urls: {
      url: string;
      name: string;
    }[]
  ) => void;
};

function UploadFile({ idAdvisorGroup, value = [], onChange }: UploadFileProps) {
  const { edgestore } = useEdgeStore();

  const valueRef = React.useRef(value);

  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const uploadFn: UploadFn = useCallback(
    async ({ file, onProgressChange, signal }) => {
      try {
        const res = await edgestore.pdfFiles.upload({
          file,
          signal,
          input: { type: `post/internship_management/${idAdvisorGroup}` },
          options: {
            manualFileName: file.name + `_v${Date.now()}`,
          },
          onProgressChange,
        });

        return res;
      } catch (e) {
        throw e;
      }
    },
    [edgestore, idAdvisorGroup]
  );

  const handleDelete = async (url: string): Promise<{ success: boolean }> => {
    try {
      await edgestore.pdfFiles.delete({ url: url });

      const newValue = valueRef.current.filter((u) => u.url !== url);
      valueRef.current = newValue;
      onChange?.(newValue);

      return { success: true };
    } catch (e) {
      return { success: false };
    }
  };

  return (
    <div className="pl-4">
      <div>
        <UploaderProvider
          uploadFn={uploadFn}
          autoUpload
          onUploadCompleted={(file) => {
            if (file.url && file.file.name) {
              const currentValue = valueRef.current;

              const exists = currentValue.some((v) => v.url === file.url);

              if (!exists) {
                const newValue = [
                  ...currentValue,
                  { url: file.url, name: file.file.name },
                ];
                valueRef.current = newValue;
                onChange?.(newValue);
              }
            }
          }}>
          <FileUploader
            maxFiles={6}
            maxSize={10 * 1024 * 1024}
            accept={{
              "application/pdf": [],
              "application/excel": [],
              "application/xlsx": [],
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [],
              "application/word": [],
              "application/powerpoint": [],
              "application/zip": [],
              "application/rar": [],
              "text/plain": [".txt"],
              "image/*": [".jpeg", ".jpg", ".png"],
            }}
            onDelete={handleDelete}
          />
        </UploaderProvider>
      </div>
    </div>
  );
}

export default memo(UploadFile);
