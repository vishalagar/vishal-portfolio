import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/content/site";

export const alt = "Vishal Agarwal, AI engineer: pixel-art portrait beside a live football scorebug";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const sheet = await readFile(join(process.cwd(), "public", "sprite", "vishal-sheet.png"));
  const src = `data:image/png;base64,${sheet.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#08130e", color: "#eef3ea", padding: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", border: "4px solid #3a6150", alignSelf: "flex-start", fontSize: 34, fontWeight: 800 }}>
            <div style={{ background: "#e5432f", color: "#fff", padding: "8px 18px" }}>LIVE</div>
            <div style={{ background: "#0f1f17", padding: "8px 18px", display: "flex" }}>
              VA
              <span style={{ background: "#f5d547", color: "#0b1610", padding: "0 14px", margin: "0 14px" }}>6 – 0</span>
              BUGS
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 0.95, textTransform: "uppercase" }}>{SITE.name}</div>
            <div style={{ fontSize: 56, fontWeight: 800, color: "#f5d547", textTransform: "uppercase", marginTop: 12 }}>
              Builds models that see.
            </div>
            <div style={{ fontSize: 28, color: "#a7bcae", marginTop: 20 }}>
              {`${SITE.role}, ${SITE.employer} · ${SITE.city}`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", width: 384, height: 502, overflow: "hidden", border: "4px solid #3a6150", background: "#103020", alignSelf: "flex-end" }}>
          {/* first frame of the sprite sheet (eyes open) */}
          <img src={src} width={1920} height={448} alt="" style={{ marginBottom: 0 }} />
        </div>
      </div>
    ),
    size,
  );
}
