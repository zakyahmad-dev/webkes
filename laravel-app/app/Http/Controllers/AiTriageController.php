<?php

namespace App\Http\Controllers;

use App\Models\{AiConsultation, AiMessage, AiRecommendation, AiRecommendationDoctor, Doctor};
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AiTriageController extends ApiController
{
    /** Kata kunci darurat multi-level (Blueprint §16 — Red Flags). */
    private const RED_FLAGS = [
        ['pattern' => '/nyeri\s+dada|dada\s+tertindih|sesak\s+napas\s+berat|chest\s+pain/iu',
         'reason' => 'Nyeri dada akut atau sesak napas berat berisiko sindrom koroner akut (serangan jantung).'],
        ['pattern' => '/bicara\s+pelo|lumpuh\s+sebelah|wajah\s+mencong|stroke|mati\s+rasa\s+separuh/iu',
         'reason' => 'Defisit saraf fokal mendadak mengindikasikan Stroke Akut (Golden Period 4,5 jam).'],
        ['pattern' => '/pingsan|hilang\s+kesadaran|tidak\s+sadarkan\s+diri|koma/iu',
         'reason' => 'Penurunan kesadaran mendadak memerlukan resusitasi darurat segera.'],
        ['pattern' => '/muntah\s+darah|buang\s+air\s+besar\s+hitam|perdarahan\s+hebat/iu',
         'reason' => 'Perdarahan masif saluran cerna atau perdarahan aktif.'],
        ['pattern' => '/kejang|konvulsi|seizure/iu',
         'reason' => 'Kejang berulang / status epileptikus memerlukan penanganan gawat darurat.'],
        ['pattern' => '/bibir\s+biru|saturasi\s+di\s+bawah\s+90|tidak\s+bisa\s+bernapas/iu',
         'reason' => 'Distres napas akut / gagal napas hipoksemia.'],
    ];

    /** Aturan pemetaan gejala → spesialisasi & urgensi. */
    private const SPECIALTY_RULES = [
        ['pattern' => '/jantung|debar|palpitasi|tensi\s+tinggi|hipertensi|aritmia/iu',
         'spec' => 'jantung-kardiovaskular', 'symptoms' => ['Keluhan Kardiovaskular', 'Palpitasi/Tensi'], 'urgency' => 'urgent'],
        ['pattern' => '/anak|bayi|balita|imunisasi|tumbuh\s+kembang|panas\s+anak/iu',
         'spec' => 'anak-pediatri', 'symptoms' => ['Keluhan Pediatrik', 'Demam/Kesehatan Anak'], 'urgency' => 'routine'],
        ['pattern' => '/saraf|kepala|pusing|migrain|vertigo|kebas|kesemutan|punggung/iu',
         'spec' => 'saraf-neurologi', 'symptoms' => ['Keluhan Neurologis', 'Pusing/Sakit Kepala'], 'urgency' => 'routine'],
        ['pattern' => '/tulang|sendi|lutut|patah|keseleo|otot|engkel|bahu/iu',
         'spec' => 'orthopedi', 'symptoms' => ['Keluhan Muskuloskeletal', 'Nyeri Sendi/Tulang'], 'urgency' => 'routine'],
        ['pattern' => '/mata|buram|kabur|katarak|merah|silau|visus/iu',
         'spec' => 'mata-oftalmologi', 'symptoms' => ['Keluhan Oftalmologi', 'Gangguan Penglihatan'], 'urgency' => 'routine'],
    ];

    public function triage(Request $request): JsonResponse
    {
        $v = $request->validate([
            'message' => 'required|string|min:3|max:2000',
            'consultationCode' => 'nullable|string',
            'patientId' => 'nullable|integer|exists:patients,id',
        ]);

        $text = trim($v['message']);

        // 1) Deteksi red flag multi-tier
        $isEmergency = false;
        $emergencyReason = null;
        foreach (self::RED_FLAGS as $flag) {
            if (preg_match($flag['pattern'], $text)) {
                $isEmergency = true;
                $emergencyReason = $flag['reason'];
                break;
            }
        }

        // 2) Rule-engine pemetaan spesialisasi
        $matchedSpecSlug = 'penyakit-dalam';
        $symptoms = $isEmergency ? ['Kegawatan Medis Akut'] : ['Keluhan Organ Dalam', 'Gejala Umum'];
        $urgency = $isEmergency ? 'emergency' : 'routine';

        foreach (self::SPECIALTY_RULES as $rule) {
            if (preg_match($rule['pattern'], $text)) {
                $matchedSpecSlug = $rule['spec'];
                $symptoms = $rule['symptoms'];
                $urgency = $isEmergency ? 'emergency' : $rule['urgency'];
                break;
            }
        }

        // 3) Rekomendasi dokter (kecuali kegawatdaruratan → blokir alur booking reguler)
        $doctors = Doctor::with(['specialization:id,name,slug', 'polyclinic:id,name,slug,location_note,queue_prefix'])
            ->where('is_active', true)
            ->whereHas('specialization', fn ($s) => $s->where('slug', $matchedSpecSlug))
            ->orderByDesc('rating')->limit(3)->get();
        if ($doctors->isEmpty()) {
            $doctors = Doctor::with(['specialization', 'polyclinic'])->where('is_active', true)->limit(2)->get();
        }

        // 4) Susun jawaban klinis + disclaimer hukum
        $responseText = $isEmergency
            ? "⚠️ **PERINGATAN KEGAWATDARURATAN MEDIS (RED ALERT)**\n\n"
              . "Berdasarkan keluhan: \"{$text}\", terdeteksi tanda bahaya medis yang berpotensi mengancam jiwa.\n\n"
              . "🚨 **{$emergencyReason}**\n\n"
              . "**TINDAKAN SEGERA:**\n1. Hubungi Hotline IGD 24 Jam HealthHub 021-555-0119 atau Ambulans 119.\n"
              . "2. Jangan mengemudi sendiri, minta pendampingan keluarga.\n3. Hindari makan/minum berlebih bila dicurigai serangan akut.\n\n"
              . "*Sistem menghentikan alur booking reguler demi keselamatan Anda.*"
            : "Halo! Saya **HealthHub AI Health Assistant**. Analisis gejala Anda: **" . implode(', ', $symptoms) . "**.\n\n"
              . ($urgency === 'urgent' ? '• **Tingkat Urgensi:** Urgent — disarankan konsultasi 1–2 hari ke depan.' : '• **Tingkat Urgensi:** Rutin — dapat dijadwalkan.') . "\n"
              . "• **Poliklinik Tujuan:** {$doctors[0]->polyclinic->name}\n"
              . "• **Dokter Rekomendasi:** {$doctors[0]->name} ({$doctors[0]->experience_years}+ tahun, rating {$doctors[0]->rating}/5)\n\n"
              . "💡 *Disclaimer: panduan triage awal berbasis protokol klinis, bukan pengganti diagnosis dokter.*";

        // 5) Persist sesi konsultasi (traceability, audit AI)
        $consultation = AiConsultation::updateOrCreate(
            ['consultation_code' => $v['consultationCode'] ?? 'AI-' . Str::upper(Str::random(12))],
            [
                'user_id' => $request->user()?->id,
                'patient_id' => $v['patientId'] ?? null,
                'status' => $isEmergency ? 'emergency' : 'active',
                'emergency_flag' => $isEmergency,
                'emergency_reason' => $emergencyReason,
                'ip_hash' => hash('sha256', (string) $request->ip()),
            ]
        );

        AiMessage::create(['ai_consultation_id' => $consultation->id, 'role' => 'user', 'content' => $text]);
        AiMessage::create([
            'ai_consultation_id' => $consultation->id,
            'role' => 'assistant',
            'content' => $responseText,
            'extracted_symptoms' => $symptoms,
            'safety_flags' => ['isEmergency' => $isEmergency, 'redFlags' => $emergencyReason ? [$emergencyReason] : []],
        ]);

        if (! $isEmergency && $doctors->isNotEmpty()) {
            $recommendation = AiRecommendation::create([
                'ai_consultation_id' => $consultation->id,
                'specialization_id' => $doctors[0]->specialization_id,
                'polyclinic_id' => $doctors[0]->polyclinic_id,
                'urgency_level' => $urgency,
                'reasoning_summary' => 'Gejala: ' . implode(', ', $symptoms),
            ]);
            foreach ($doctors as $i => $doc) {
                AiRecommendationDoctor::create([
                    'ai_recommendation_id' => $recommendation->id,
                    'doctor_id' => $doc->id,
                    'rank' => $i + 1,
                ]);
            }
        }

        return $this->ok([
            'consultationCode' => $consultation->consultation_code,
            'message' => $responseText,
            'isEmergency' => $isEmergency,
            'emergencyReason' => $emergencyReason,
            'urgencyLevel' => $urgency,
            'extractedSymptoms' => $symptoms,
            'recommendedSpecialization' => $doctors[0]->specialization->name ?? 'Penyakit Dalam',
            'recommendedPolyclinic' => [
                'id' => $doctors[0]->polyclinic_id ?? null,
                'name' => $doctors[0]->polyclinic->name ?? 'Poli Penyakit Dalam',
                'location' => $doctors[0]->polyclinic->location_note ?? 'Gedung A, Lt 2',
            ],
            'recommendedDoctors' => $isEmergency ? [] : $doctors->map(fn ($d) => [
                'id' => $d->id,
                'name' => $d->name,
                'titleSuffix' => $d->title_suffix,
                'photoPath' => $d->photo_path,
                'rating' => $d->rating,
                'experienceYears' => $d->experience_years,
                'consultationFee' => (string) $d->consultation_fee,
                'polyclinicId' => $d->polyclinic_id,
                'polyclinicName' => $d->polyclinic->name,
                'specializationName' => $d->specialization->name,
                'nextSlot' => 'Hari ini / Besok 09:00 - 12:00 WIB',
            ]),
            'emergencyHotlines' => ['igd' => '021-555-0119', 'ambulance' => '021-555-0118 / 119', 'hospital' => '(021) 555-0100'],
        ]);
    }
}
