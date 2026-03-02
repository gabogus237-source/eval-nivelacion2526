"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const mail = email.trim().toLowerCase();
    const pass = cedula.trim();
    if (!mail.includes("@")) return setMsg("Ingresa un correo válido.");
    if (!pass) return setMsg("Ingresa tu cédula (será tu contraseña).");

    setLoading(true);
    try {
      // 1) Bootstrap: valida contra student_directory/docente_directory y crea/upsertea usuario + perfil.
      const prep = await fetch("/api/bootstrap-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail, cedula: pass }),
      });

      if (!prep.ok) {
        const t = await prep.text();
        setMsg(t || "No se pudo validar tu acceso.");
        return;
      }

      // 2) Login normal (email + contraseña)
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: pass,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <img
          src="/inicio.png"
          alt="Evaluación Docentes 2025-2026"
          style={{ width: "100%", maxWidth: 980, borderRadius: 12, display: "block" }}
        />
      </div>
      <h1>Ingreso</h1>
      <p>Accede con tu correo y cédula.</p>

      <form onSubmit={onLogin}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@uce.edu.ec"
          style={{ padding: 10, width: "100%", maxWidth: 420 }}
        />
        <div style={{ height: 12 }} />
        <input
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          placeholder="Cédula (contraseña)"
          style={{ padding: 10, width: "100%", maxWidth: 420 }}
        />
        <div style={{ height: 12 }} />
        <button disabled={loading} style={{ padding: 10 }}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12, color: "crimson" }}>{msg}</p>}

      <p style={{ marginTop: 18, fontSize: 12, color: "#666" }}>
        Nota: si eres docente con correo no institucional, tu correo debe estar en la whitelist.
      </p>
    </div>
  );
}
