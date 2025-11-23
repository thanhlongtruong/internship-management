import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";
import z from "zod";

const es = initEdgeStore.create();

const edgeStoreRouter = es.router({
  pdfFiles: es
    .fileBucket({
      accept: [
        "application/pdf",
        "application/excel",
        "application/xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/word",
        "application/powerpoint",
        "application/zip",
        "application/rar",
        ".txt",
        "image/*",
        "text/plain",
      ],

      maxSize: 10 * 1024 * 1024,
    })
    .beforeDelete(({ ctx, fileInfo }) => {
      return true;
    })
    .input(
      z.object({
        type: z.enum([`post/internship_management/${z.string()}`, "profile"]),
      })
    )
    .path(({ input }) => [{ type: input.type }]),
});

const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export { handler as GET, handler as POST };
export type EdgeStoreRouter = typeof edgeStoreRouter;
