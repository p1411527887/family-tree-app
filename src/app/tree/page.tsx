"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { treeData as fallbackTree, type TreeNodeData } from "@/lib/family-data";
import RemoteImage from "@/components/RemoteImage";
import Link from "next/link";
import { useEffect, useState } from "react";

function TreeNode({ node }: { node: TreeNodeData }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-8 items-center border border-secondary/20 p-4 bg-wood/50 rounded-xl relative">
        <Link href={`/profile/${node.id}`} className="text-center group">
          <div className="portrait-frame mb-4 transform transition-transform group-hover:scale-105">
            <RemoteImage
              className="w-24 h-32 object-cover grayscale brightness-110"
              src={node.image}
              alt={node.name}
              width={96}
              height={128}
            />
          </div>
          <h4 className="font-label-md text-secondary text-sm">{node.name}</h4>
          <p className="text-[10px] text-on-surface/50 mt-1">{node.role}</p>
        </Link>

        {node.spouse && (
          <>
            <div className="w-8 h-px bg-secondary/50" />
            <Link href={`/profile/${node.id}-spouse`} className="text-center group">
              <div className="portrait-frame mb-4 transform transition-transform group-hover:scale-105">
                <RemoteImage
                  className="w-24 h-32 object-cover grayscale brightness-110"
                  src={node.spouse.image}
                  alt={node.spouse.name}
                  width={96}
                  height={128}
                />
              </div>
              <h4 className="font-label-md text-secondary text-sm">{node.spouse.name}</h4>
              <p className="text-[10px] text-on-surface/50 mt-1">{node.spouse.role}</p>
            </Link>
          </>
        )}
      </div>

      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          <div className="w-0.5 h-12 bg-gradient-to-b from-secondary to-transparent" />
          <div className="flex relative mt-4">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-[50%] right-0 w-full h-px bg-secondary/30 -translate-x-1/2" />
            )}
            <div className="flex gap-16 pt-8">
              {node.children.map((child) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  <div className="absolute -top-8 w-px h-8 bg-secondary/30" />
                  <TreeNode node={child} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TreePage() {
  const [tree, setTree] = useState<TreeNodeData>(fallbackTree);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tree");
        const data = (await res.json()) as { ok?: boolean; tree?: TreeNodeData };
        if (!cancelled && data.ok && data.tree) setTree(data.tree);
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen flex flex-col bg-surface">
        <Reveal className="text-center py-12 bg-wood/30 border-b border-secondary/10">
          <h1 className="font-headline-xl text-5xl md:text-6xl font-extrabold gold-gradient-text mb-4 drop-shadow-lg leading-tight uppercase">
            Cây Gia Phả Dòng Họ
          </h1>
          <p className="text-secondary font-label-md tracking-[0.3em] uppercase text-sm">
            Dữ liệu từ CSDL · zoom & pan
          </p>
          <div className="gold-divider w-32 mx-auto mt-6" />

          <div className="flex justify-center gap-6 mt-8 opacity-70">
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined" aria-hidden>
                zoom_in
              </span>{" "}
              Phóng to
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined" aria-hidden>
                pan_tool
              </span>{" "}
              Kéo thả
            </div>
          </div>
        </Reveal>

        <div className="flex-1 w-full bg-[#110a14] relative overflow-hidden citadel-pattern flex justify-center items-center">
          <TransformWrapper initialScale={1} minScale={0.2} maxScale={4} centerOnInit>
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2 bg-wood/80 p-2 rounded-lg border border-secondary/30">
                  <button
                    type="button"
                    onClick={() => zoomIn()}
                    className="p-2 hover:text-secondary hover:bg-surface rounded transition-colors"
                    aria-label="Phóng to"
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      zoom_in
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomOut()}
                    className="p-2 hover:text-secondary hover:bg-surface rounded transition-colors"
                    aria-label="Thu nhỏ"
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      zoom_out
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => resetTransform()}
                    className="p-2 hover:text-secondary hover:bg-surface rounded transition-colors"
                    aria-label="Đặt lại"
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      restart_alt
                    </span>
                  </button>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "80vh" }}
                  contentStyle={{ minWidth: "100%", minHeight: "100%" }}
                >
                  <div className="p-32 flex justify-center items-center">
                    <TreeNode node={tree} />
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      </main>
      <Footer />
    </>
  );
}
