"use client";

import dynamic from "next/dynamic";
import { Document, Page, Text, View, StyleSheet, Image as PDFImage } from "@react-pdf/renderer";
import { useEffect, useState } from "react";

// Estilos básicos para el PDF
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center", fontWeight: "bold" },
  image: { width: 300, height: 300, alignSelf: "center", marginBottom: 20, borderRadius: 10 },
  sectionTitle: { fontSize: 16, marginTop: 15, marginBottom: 5, fontWeight: "bold", borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 2 },
  text: { fontSize: 12, lineHeight: 1.5, marginBottom: 10 },
  ingredientRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  ingredientName: { fontSize: 12 },
  ingredientAmount: { fontSize: 12, fontWeight: "bold" },
  cost: { fontSize: 14, marginTop: 20, textAlign: "right", fontWeight: "bold" },
});

export const TechSheetDocument = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{data.title}</Text>
      
      {data.imageUrl && <PDFImage src={data.imageUrl} style={styles.image} />}

      <View>
        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {data.ingredients.map((ing: any, i: number) => (
          <View key={i} style={styles.ingredientRow}>
            <Text style={styles.ingredientName}>{ing.name}</Text>
            <Text style={styles.ingredientAmount}>{ing.amount}</Text>
          </View>
        ))}
      </View>

      <View>
        <Text style={styles.sectionTitle}>Método de Elaboración</Text>
        <Text style={styles.text}>{data.method}</Text>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Notas Organolépticas</Text>
        <Text style={styles.text}>{data.organolepticDesc}</Text>
      </View>

      {data.cost && (
        <Text style={styles.cost}>Coste Estimado: {data.cost} €</Text>
      )}
    </Page>
  </Document>
);

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

export default function PDFExport({ data }: { data: any }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <PDFDownloadLink
      document={<TechSheetDocument data={data} />}
      fileName={`${data.title.replace(/\s+/g, "_")}_TechSheet.pdf`}
      className="inline-block mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded transition-colors"
    >
      {/* @ts-ignore */}
      {({ loading }: { loading: boolean }) =>
        loading ? "Generando PDF..." : "Descargar Ficha en PDF"
      }
    </PDFDownloadLink>
  );
}
