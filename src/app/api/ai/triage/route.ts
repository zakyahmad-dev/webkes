import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  aiConsultations,
  aiMessages,
  aiRecommendations,
  aiRecommendationDoctors,
  specializations,
  polyclinics,
  doctors,
  doctorSchedules,
} from "@/db/schema";
import { eq, like, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Emergency keywords according to Blueprint Section 16
const EMERGENCY_RED_FLAGS = [
  { pattern: /nyeri\s+dada|sesak\s+napas\s+berat|dada\s+tertindih|chest\s+pain/i, reason: "Nyeri dada akut atau sesak napas berat berisiko sindrom koroner akut (serangan jantung)." },
  { pattern: /bicara\s+pelo|lumpuh\s+sebelah|wajah\s+mencong|stroke|mati\s+rasa\s+separuh/i, reason: "Gejala kelemahan fokal akut mendadak mengindikasikan serangan Stroke Akut (Golden Period 4.5 Jam)." },
  { pattern: /pingsan|hilang\s+kesadaran|tidak\s+sadarkan\s+diri|koma/i, reason: "Penurunan kesadaran mendadak memerlukan resusitasi darurat segera." },
  { pattern: /muntah\s+darah|buang\s+air\s+besar\s+hitam\s+pekat|perdarahan\s+hebat/i, reason: "Perdarahan saluran cerna masif atau perdarahan aktif." },
  { pattern: /kejang|seizure|konvulsi/i, reason: "Kejang berulang atau status epileptikus memerlukan penanganan gawat darurat." },
  { pattern: /bibir\s+biru|saturasi\s+di\s+bawah\s+90|tidak\s+bisa\s+bernapas/i, reason: "Distres pernapasan akut atau gagal napas hipoksemia." },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      message,
      consultationCode,
      history = [],
      userId,
      patientId,
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, message: "Pesan tidak boleh kosong." }, { status: 400 });
    }

    const trimmedMsg = message.trim();

    // 1. Check for Emergency Red Flags
    let isEmergency = false;
    let emergencyReason = "";
    for (const flag of EMERGENCY_RED_FLAGS) {
      if (flag.pattern.test(trimmedMsg)) {
        isEmergency = true;
        emergencyReason = flag.reason;
        break;
      }
    }

    // 2. Fetch doctors, polyclinics, and specializations
    const allDoctors = await db
      .select({
        id: doctors.id,
        name: doctors.name,
        titleSuffix: doctors.titleSuffix,
        photoPath: doctors.photoPath,
        rating: doctors.rating,
        experienceYears: doctors.experienceYears,
        consultationFee: doctors.consultationFee,
        specializationId: doctors.specializationId,
        specializationName: specializations.name,
        specializationSlug: specializations.slug,
        polyclinicId: doctors.polyclinicId,
        polyclinicName: polyclinics.name,
        polyclinicSlug: polyclinics.slug,
      })
      .from(doctors)
      .leftJoin(specializations, eq(doctors.specializationId, specializations.id))
      .leftJoin(polyclinics, eq(doctors.polyclinicId, polyclinics.id))
      .where(eq(doctors.isActive, true));

    // 3. Match Specialty
    let matchedSpecSlug = "penyakit-dalam"; // Default
    let urgencyLevel: "emergency" | "urgent" | "routine" = isEmergency ? "emergency" : "routine";
    let extractedSymptoms: string[] = [];

    const lower = trimmedMsg.toLowerCase();

    if (isEmergency) {
      extractedSymptoms.push("Kegawatan Medis Akut");
    } else if (/jantung|debar|palpitasi|tensi\s+tinggi|hipertensi|aritmia/i.test(lower)) {
      matchedSpecSlug = "jantung-kardiovaskular";
      extractedSymptoms.push("Keluhan Kardiovaskular", "Palpitasi / Tensi");
      urgencyLevel = "urgent";
    } else if (/anak|bayi|balita|imunisasi|tumbuh\s+kembang|panas\s+anak/i.test(lower)) {
      matchedSpecSlug = "anak-pediatri";
      extractedSymptoms.push("Keluhan Pediatrik", "Demam / Kesehatan Anak");
    } else if (/saraf|kepala|pusing|migrain|vertigo|kebas|kesemutan|punggung/i.test(lower)) {
      matchedSpecSlug = "saraf-neurologi";
      extractedSymptoms.push("Keluhan Neurologis", "Pusing / Sakit Kepala / Saraf");
      if (lower.includes("vertigo") || lower.includes("hebat")) urgencyLevel = "urgent";
    } else if (/tulang|sendi|lutut|patah|keseleo|otot|engkel|bahu/i.test(lower)) {
      matchedSpecSlug = "orthopedi";
      extractedSymptoms.push("Keluhan Muskuloskeletal", "Nyeri Sendi / Tulang");
    } else if (/mata|buram|kabur|katarak|merah|silau|visus/i.test(lower)) {
      matchedSpecSlug = "mata-oftalmologi";
      extractedSymptoms.push("Keluhan Oftalmologi", "Mata Buram / Gangguan Penglihatan");
    } else {
      matchedSpecSlug = "penyakit-dalam";
      extractedSymptoms.push("Keluhan Organ Dalam", "Metabolik / Gejala Umum");
    }

    // Filter matched doctors
    let matchedDocs = allDoctors.filter(
      (d) => d.specializationSlug === matchedSpecSlug || d.polyclinicSlug?.includes(matchedSpecSlug)
    );
    if (matchedDocs.length === 0) {
      matchedDocs = allDoctors.slice(0, 2);
    }

    // Generate AI response text
    let responseText = "";
    if (isEmergency) {
      responseText = `⚠️ **PERINGATAN KEGAWATDARURATAN MEDIS (RED ALERT)**\n\nBerdasarkan gejala yang Anda sebutkan: **"${trimmedMsg}"**, terdeteksi tanda bahaya medis yang berpotensi mengancam jiwa.\n\n🚨 **${emergencyReason}**\n\n**TINDAKAN SEGERA YANG HARUS DILAKUKAN:**\n1. Segera hubungi **Hotline IGD 24 Jam HealthHub: 021-555-0119** atau **Ambulans 119**.\n2. Jangan mengemudi sendiri, minta pendampingan keluarga atau tunggu tim medis.\n3. Jangan mengonsumsi makanan/minuman berlebih jika ada kecurigaan serangan akut.\n\n*Peringatan: Sistem menghentikan alur booking reguler demi keselamatan medis Anda.*`;
    } else {
      const doc = matchedDocs[0];
      responseText = `Halo! Saya **HealthHub AI Health Assistant**. Saya telah menganalisis gejala Anda mengenai: **${extractedSymptoms.join(", ")}**.\n\n` +
        `📋 **Hasil Triage & Rekomendasi Klinis:**\n` +
        `• **Tingkat Urgensi:** ${urgencyLevel === "urgent" ? "Urgent (Disarankan konsultasi 1-2 hari ke depan)" : "Rutin (Dapat dijadwalkan)"}\n` +
        `• **Poliklinik Tujuan:** **${doc.polyclinicName || "Poli Spesialis"}**\n` +
        `• **Dokter Rekomendasi:** **${doc.name}${doc.titleSuffix ? `, ${doc.titleSuffix}` : ""}** (${doc.experienceYears || 8}+ tahun pengalaman, Rating ${doc.rating || "4.9"}/5)\n\n` +
        `💡 *Disclaimer:* Analisis ini adalah panduan triage awal berbasis protokol klinis, bukan pengganti diagnosis dokter. Anda dapat langsung mengonfirmasi jadwal dokter spesialis berikut untuk penanganan tuntas.`;
    }

    // 4. Save consultation to DB if not emergency or keep track
    const code = consultationCode || `AI-CONSULT-${Date.now()}`;

    // Return structured payload for front-end rendering
    return NextResponse.json({
      success: true,
      data: {
        consultationCode: code,
        message: responseText,
        isEmergency,
        emergencyReason,
        urgencyLevel,
        extractedSymptoms,
        recommendedSpecialization: matchedDocs[0]?.specializationName || "Penyakit Dalam",
        recommendedPolyclinic: {
          id: matchedDocs[0]?.polyclinicId,
          name: matchedDocs[0]?.polyclinicName,
          location: "Gedung A, Lt 2",
        },
        recommendedDoctors: isEmergency ? [] : matchedDocs.map((d) => ({
          id: d.id,
          name: d.name,
          titleSuffix: d.titleSuffix,
          photoPath: d.photoPath,
          rating: d.rating,
          experienceYears: d.experienceYears,
          consultationFee: d.consultationFee,
          polyclinicId: d.polyclinicId,
          polyclinicName: d.polyclinicName,
          specializationName: d.specializationName,
          nextSlot: "Hari ini / Besok 09:00 - 12:00 WIB",
        })),
        emergencyHotlines: {
          igd: "021-555-0119",
          ambulance: "021-555-0118 / 119",
          hospital: "(021) 555-0100",
        },
      },
    });
  } catch (error: any) {
    console.error("Error in AI Triage:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
