"use client";

export default function LogoutButton() {
  return (
    <form action="/auth/logout" method="post">
      <button
        type="submit"
        style={{
          padding: 8,
          border: "1px solid #ddd",
          borderRadius: 8,
          cursor: "pointer",
          background: "white",
        }}
      >
        Salir
      </button>
    </form>
  );
}