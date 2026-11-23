import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "Sika Cuisine — Authentic Ghanaian Dining & Delivery in Sunyani";

/**
 * Dynamically renders Sika Cuisine's editorial OpenGraph card for WhatsApp, X,
 * and search rich previews without relying on external runtime image requests.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 80% 25%, rgba(215, 25, 32, 0.28) 0%, #101010 55%)",
          backgroundColor: "#101010",
          color: "#F5F1EA",
          padding: "56px 64px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          borderTop: "6px solid #D71920",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              border: "1px solid #333333",
              backgroundColor: "#1C1C1C",
              borderRadius: "999px",
              padding: "10px 22px",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "3px",
              color: "#F0444A",
              textTransform: "uppercase",
            }}
          >
            SUNYANI CENTRAL · BONO REGION, GHANA
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontWeight: 800,
              color: "#4ADE80",
              border: "1px solid rgba(74, 222, 128, 0.35)",
              backgroundColor: "rgba(34, 197, 94, 0.12)",
              borderRadius: "999px",
              padding: "10px 22px",
            }}
          >
            Pickup GHS 0.00 · Doorstep Delivery
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "980px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "76px",
              fontWeight: 900,
              letterSpacing: "-2px",
              lineHeight: 1.05,
              color: "#FFFFFF",
            }}
          >
            SIKA CUISINE.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "34px",
              fontWeight: 500,
              lineHeight: 1.35,
              color: "#D4D4D4",
            }}
          >
            Charcoal-Grilled Whole Tilapia · Smoky Party Jollof · Pounded Fufu &amp; Banku · Stone-Baked Pizza
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #333333",
            paddingTop: "24px",
            fontSize: "22px",
            color: "#A3A3A3",
          }}
        >
          <div style={{ display: "flex" }}>
            Commercial Street, Sunyani Central &bull; Open Daily
          </div>
          <div style={{ display: "flex", color: "#F0444A", fontWeight: 700 }}>
            0533 376 760
          </div>
        </div>
      </div>
    ),
    size
  );
}
