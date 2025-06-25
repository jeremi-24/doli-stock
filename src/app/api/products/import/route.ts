
import { NextResponse } from 'next/server';
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
        return NextResponse.json({ error: "Le fichier Excel est vide ou invalide." }, { status: 400 });
    }

    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<any>(worksheet);

    return NextResponse.json(json, { status: 200 });

  } catch (error: any) {
    console.error("Import API Error:", error);
    return NextResponse.json({ error: "Erreur lors du traitement du fichier.", details: error.message }, { status: 500 });
  }
}
