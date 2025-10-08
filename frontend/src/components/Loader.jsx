// frontend/src/components/Loader.jsx
import React from "react";

export default function Loader({ text = "Loading..." }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: 20,
        fontWeight: "500",
        color: "#444",
      }}
    >
      {text}
    </div>
  );
}
