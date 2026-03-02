"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{ marginLeft: 12, padding: "8px 12px", cursor: "pointer" }}
    >
      Imprimir / Guardar PDF
    </button>
  );
}