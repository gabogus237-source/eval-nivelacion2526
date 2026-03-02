import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

// ✅ (RECOMENDADO) Fuerza Node runtime (PDF/Buffer suele fallar en Edge)
export const runtime = "nodejs";

// Genera el PDF de un docente (nota total + componentes), similar a la plantilla.

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11 },
  title: { fontSize: 16, marginBottom: 10, fontWeight: 700 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  box: { border: "1px solid #333", padding: 10, marginTop: 12 },
  h2: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  small: { fontSize: 10, color: "#444" },
});

function qualLabel(total: number) {
  if (total >= 91) return "Destacado";
  if (total >= 81) return "Competente";
  if (total >= 70) return "Satisfactorio";
  return "Insatisfactorio";
}

export async function GET(_req: Request, { params }: any) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const docenteId = params.docenteId as string;

  // Perfil (sin nombre)
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", docenteId)
    .maybeSingle();

  if (pErr || !profile) {
    return NextResponse.json({ error: pErr?.message || "Docente no encontrado" }, { status: 404 });
  }

  // Resumen de evaluaciones por componente
  const { data: rows, error: rErr } = await supabase
    .from("report_docente")
    .select("component, score_pct")
    .eq("docente_id", docenteId);

  if (rErr) {
    return NextResponse.json({ error: rErr.message }, { status: 500 });
  }

  // Ponderaciones
  const weights: Record<string, number> = {
    HET: 0.4,
    AUTO: 0.1,
    DIR: 0.2,
    PAR: 0.3,
  };

  const scores: Record<string, number> = { HET: 0, AUTO: 0, DIR: 0, PAR: 0 };
  (rows || []).forEach((r: any) => {
    scores[r.component] = Number(r.score_pct || 0);
  });

  const total =
    scores.HET * weights.HET +
    scores.AUTO * weights.AUTO +
    scores.DIR * weights.DIR +
    scores.PAR * weights.PAR;

  const qualitative = qualLabel(total);

  const now = new Date();
  const fecha = now.toISOString().slice(0, 10);

  const PdfDoc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Informe de Evaluación Docente</Text>

        <View style={styles.row}>
          <Text>Docente:</Text>
          <Text>{profile.email || profile.id}</Text>
        </View>
        <View style={styles.row}>
          <Text>Fecha:</Text>
          <Text>{fecha}</Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.h2}>Resultados</Text>

          <View style={styles.row}>
            <Text>Heteroevaluación (40%)</Text>
            <Text>{scores.HET.toFixed(2)}%</Text>
          </View>
          <View style={styles.row}>
            <Text>Autoevaluación (10%)</Text>
            <Text>{scores.AUTO.toFixed(2)}%</Text>
          </View>
          <View style={styles.row}>
            <Text>Coevaluación – Directivo (20%)</Text>
            <Text>{scores.DIR.toFixed(2)}%</Text>
          </View>
          <View style={styles.row}>
            <Text>Coevaluación – Par Académico (30%)</Text>
            <Text>{scores.PAR.toFixed(2)}%</Text>
          </View>

          <View style={{ marginTop: 10 }}>
            <View style={styles.row}>
              <Text style={{ fontWeight: 700 }}>TOTAL</Text>
              <Text style={{ fontWeight: 700 }}>{total.toFixed(2)}%</Text>
            </View>
            <Text style={styles.small}>Equivalencia cualitativa: {qualitative}</Text>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={styles.small}>
            Escala: 91–100 Destacado; 81–90 Competente; 70–80 Satisfactorio; menor a 70 Insatisfactorio.
          </Text>
        </View>
      </Page>
    </Document>
  );

  // ✅ renderToBuffer devuelve Buffer -> convertir a Uint8Array para NextResponse
  const pdfBuffer = await renderToBuffer(PdfDoc);
  const pdfBytes = new Uint8Array(pdfBuffer);

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=Informe_${docenteId}.pdf`,
    },
  });
}