import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

function b64urlDecode(input: string) {
  const b64 =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((input.length + 3) % 4);
  return Buffer.from(b64, "base64").toString("utf8");
}

const WEIGHTS = {
  HETERO: 40,
  AUTO: 10,
  DIRECTIVO: 20,
  PAR: 30,
} as const;

function round2(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  return Math.round(n * 100) / 100;
}

function pctFromScore(score_1a4: number | null) {
  if (score_1a4 === null) return null;
  return round2((score_1a4 / 4) * 100);
}

function pondFromPct(pct: number | null, weight: number) {
  if (pct === null) return null;
  return round2((pct * weight) / 100);
}

function escalaFromPondTotal(pondTotal: number | null) {
  if (pondTotal === null) return "—";
  if (pondTotal >= 91) return "Destacado";
  if (pondTotal >= 81) return "Competente";
  if (pondTotal >= 70) return "Satisfactorio";
  return "Insatisfactorio";
}

export default async function InformeDocentePage({
  params,
}: {
  params: { emailB64: string };
}) {
  const evaluatedEmail = b64urlDecode(String(params.emailB64 || ""))
    .trim()
    .toLowerCase();

  if (!evaluatedEmail.includes("@")) redirect("/nivelacion/reportes");

  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  // Seguridad: solo coordinación de nivelación
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "COORD_NIVELACION") redirect("/");

  // Trae promedios desde tu vista unificada
  const { data: row, error } = await supabase
    .from("v_reporte_persona_componentes_unificado")
    .select("*")
    .eq("evaluated_email", evaluatedEmail)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) throw new Error("No hay datos de evaluación para este correo.");

  // Puntajes 1..4 (vienen de la vista)
  const sH = row.prom_hetero_1a4 ?? null;
  const sA = row.prom_auto_1a4 ?? null;
  const sD = row.prom_directivo_1a4 ?? null;
  const sP = row.prom_par_1a4 ?? null;

  const pH = pctFromScore(sH);
  const pA = pctFromScore(sA);
  const pD = pctFromScore(sD);
  const pP = pctFromScore(sP);

  const pondH = pondFromPct(pH, WEIGHTS.HETERO);
  const pondA = pondFromPct(pA, WEIGHTS.AUTO);
  const pondD = pondFromPct(pD, WEIGHTS.DIRECTIVO);
  const pondP = pondFromPct(pP, WEIGHTS.PAR);

  // ✅ FIX TS: tipar reduce para que acc sea number
  const pondTotalRaw = [pondH, pondA, pondD, pondP].reduce<number>(
    (acc, v) => acc + (v ?? 0),
    0
  );
  const pondTotal = round2(pondTotalRaw);

  // Promedio simple de los componentes existentes (1..4)
  const scoresPresent = [sH, sA, sD, sP].filter(
    (x) => typeof x === "number"
  ) as number[];

  const promSimple = scoresPresent.length
    ? round2(scoresPresent.reduce((a, b) => a + b, 0) / scoresPresent.length)
    : null;

  const escala = escalaFromPondTotal(pondTotal);

  // Ajusta periodo si quieres
  const periodo = "2S-2025-2026";
  const evaluatedName = row.evaluated_name || evaluatedEmail;

  return (
    <div style={{ padding: 20 }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .page {
          width: 794px; /* aprox A4 a 96dpi */
          margin: 0 auto;
          background: white;
          color: #000;
          font-family: "Times New Roman", Times, serif;
        }
        .center { text-align: center; }
        .title { font-size: 28px; font-weight: 700; line-height: 1.1; }
        .h2 { font-size: 20px; font-weight: 700; }
        .row { display: flex; justify-content: space-between; align-items: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #000; padding: 10px; font-size: 16px; }
        th { font-weight: 700; }
        .mt { margin-top: 18px; }
        .signRow { display: flex; justify-content: space-between; margin-top: 60px; }
        .signBox { width: 48%; text-align: center; }
        .footerLine { margin-top: 60px; border-top: 2px solid #000; padding-top: 8px; font-size: 14px; text-align: center; }
      `}</style>

      {/* Botones (no imprimibles) */}
      <div className="no-print" style={{ marginBottom: 12 }}>
        <Link href="/nivelacion/reportes">← Volver</Link>
        <PrintButton />
      </div>

      <div className="page">
        {/* Encabezado con logos (poner en /public/logos/) */}
        <div className="row" style={{ marginTop: 10 }}>
          <img
            src="/logos/uce.png"
            alt="UCE"
            style={{ width: 90, height: 90, objectFit: "contain" }}
          />
          <div className="center" style={{ flex: 1 }}>
            <div className="title">UNIVERSIDAD CENTRAL DEL ECUADOR</div>
            <div className="title">FACULTAD DE CIENCIAS</div>
            <div className="title">ADMINISTRATIVAS</div>
            <div className="title" style={{ textDecoration: "underline" }}>
              COORDINACIÓN DE NIVELACIÓN
            </div>
          </div>
          <img
            src="/logos/fca.png"
            alt="FCA"
            style={{ width: 90, height: 90, objectFit: "contain" }}
          />
        </div>

        <div className="center mt">
          <div className="h2">EVALUACIÓN AL DESEMPEÑO DOCENTE</div>
        </div>

        <div style={{ marginTop: 20, fontSize: 18 }}>
          <div>UNIDAD DE NIVELACIÓN</div>
          <div className="h2" style={{ marginTop: 10 }}>
            RESULTADO INDIVIDUAL POR DOCENTE
          </div>
          <div className="mt">
            <b>PERIODO ACADÉMICO:</b> {periodo}
          </div>
          <div className="mt">
            <b>NOMBRE DEL DOCENTE:</b> {evaluatedName}
          </div>
        </div>

        <div className="h2 mt">MEDIDAS ESTADÍSTICAS</div>

        <table>
          <thead>
            <tr>
              <th style={{ width: "35%" }}>COMPONENTES</th>
              <th style={{ width: "13%" }}>PUNTAJE</th>
              <th style={{ width: "14%" }}>% LOGRO</th>
              <th style={{ width: "10%" }}>POND</th>
              <th style={{ width: "14%" }}>PUNTAJE/4</th>
              <th style={{ width: "14%" }}>POND/100</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>HETEROEVALUACIÓN</td>
              <td className="center">{sH?.toFixed?.(2) ?? ""}</td>
              <td className="center">{pH?.toFixed?.(2) ?? ""}</td>
              <td className="center">{pondH?.toFixed?.(2) ?? ""}</td>
              <td className="center">{sH?.toFixed?.(2) ?? ""}</td>
              <td className="center"></td>
            </tr>
            <tr>
              <td>AUTOEVALUACIÓN</td>
              <td className="center">{sA?.toFixed?.(2) ?? ""}</td>
              <td className="center">{pA?.toFixed?.(2) ?? ""}</td>
              <td className="center">{pondA?.toFixed?.(2) ?? ""}</td>
              <td className="center">{sA?.toFixed?.(2) ?? ""}</td>
              <td className="center"></td>
            </tr>
            <tr>
              <td>COEVALUACIÓN - DIRECTIVO</td>
              <td className="center">{sD?.toFixed?.(2) ?? ""}</td>
              <td className="center">{pD?.toFixed?.(2) ?? ""}</td>
              <td className="center">{pondD?.toFixed?.(2) ?? ""}</td>
              <td className="center">{sD?.toFixed?.(2) ?? ""}</td>
              <td className="center"></td>
            </tr>
            <tr>
              <td>COEVALUACIÓN - PAR ACADÉMICO</td>
              <td className="center">{sP?.toFixed?.(2) ?? ""}</td>
              <td className="center">{pP?.toFixed?.(2) ?? ""}</td>
              <td className="center">{pondP?.toFixed?.(2) ?? ""}</td>
              <td className="center">{sP?.toFixed?.(2) ?? ""}</td>
              <td className="center"></td>
            </tr>

            <tr>
              <td><b>TOTALES / PROMEDIOS</b></td>
              <td></td>
              <td></td>
              <td className="center">
                <b>{pondTotal?.toFixed?.(2) ?? ""}</b>
              </td>
              <td className="center">
                <b>{promSimple?.toFixed?.(2) ?? ""}</b>
              </td>
              <td className="center">
                <b>{pondTotal?.toFixed?.(2) ?? ""}</b>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt" style={{ fontSize: 18 }}>
          <b>ESCALA DE CUMPLIMIENTO:</b> {escala}
        </div>

        <div className="signRow">
          <div className="signBox">
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              FIRMA JEFE INMEDIATO
            </div>
            <div style={{ marginTop: 80, fontSize: 18 }}>
              Dra. Mary Yesennya Saltos Chacán
              <br />
              <b>COORDINADORA DE NIVELACIÓN</b>
            </div>
          </div>

          <div className="signBox">
            <div style={{ fontWeight: 700, fontSize: 18 }}>FIRMA DOCENTE</div>
            <div style={{ marginTop: 80, fontSize: 18 }}>
              {evaluatedName}
              <br />
              <b>DOCENTE DE NIVELACIÓN</b>
            </div>
          </div>
        </div>

        <div className="footerLine">
          Av. Indoamérica Nº 21-248 y San Gregorio Telf. 2527047-2527128 – Quito-Ecuador
          <br />
          fca.uce.edu.ec
        </div>
      </div>
    </div>
  );
}