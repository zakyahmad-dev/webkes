<?php

namespace App\Http\Controllers;

use App\Models\{Article, Doctor, DoctorSchedule, Patient, Polyclinic, Service, Setting, Specialization};
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupController extends ApiController
{
    public function doctors(Request $request): JsonResponse
    {
        $q = Doctor::with(['specialization:id,name,slug', 'polyclinic:id,name,slug,location_note,queue_prefix', 'schedules'])
            ->where('is_active', true);

        if ($pid = $request->integer('polyclinicId')) $q->where('polyclinic_id', $pid);
        if ($sid = $request->integer('specializationId')) $q->where('specialization_id', $sid);
        if ($search = $request->get('q')) {
            $q->where(function ($w) use ($search) {
                $w->where('name', 'ilike', "%{$search}%")
                  ->orWhereHas('specialization', fn ($s) => $s->where('name', 'ilike', "%{$search}%"))
                  ->orWhereHas('polyclinic', fn ($p) => $p->where('name', 'ilike', "%{$search}%"));
            });
        }

        return $this->ok($q->get());
    }

    public function doctorDetail(int $id): JsonResponse
    {
        $doc = Doctor::with(['specialization', 'polyclinic', 'schedules'])->where('is_active', true)->find($id);
        return $doc ? $this->ok($doc) : $this->fail('Dokter tidak ditemukan.', 404);
    }

    public function polyclinics(): JsonResponse
    {
        $list = Polyclinic::with('specialization:id,name')
            ->withCount(['doctors' => fn ($d) => $d->where('is_active', true)])
            ->where('is_active', true)->get();
        return $this->ok($list);
    }

    public function specializations(): JsonResponse
    {
        return $this->ok(Specialization::where('is_active', true)->orderBy('name')->get());
    }

    public function services(): JsonResponse
    {
        return $this->ok(Service::where('is_active', true)->orderBy('sort_order')->get());
    }

    public function schedules(): JsonResponse
    {
        $list = DoctorSchedule::with(['doctor:id,name,title_suffix,photo_path,polyclinic_id,specialization_id', 'doctor.polyclinic:id,name,queue_prefix', 'doctor.specialization:id,name'])
            ->where('is_active', true)
            ->whereHas('doctor', fn ($d) => $d->where('is_active', true))
            ->orderBy('day_of_week')->orderBy('start_time')->get();
        return $this->ok($list);
    }

    public function patients(Request $request): JsonResponse
    {
        $q = Patient::query()->latest();
        if ($uid = $request->integer('userId')) $q->where('user_id', $uid);
        if ($id = $request->integer('id')) $q->where('id', $id);
        return $this->ok($q->get());
    }

    public function articles(Request $request): JsonResponse
    {
        $q = Article::with('author:id,name')->where('status', 'published')->latest('published_at');
        if (($cat = $request->get('category')) && $cat !== 'Semua') $q->where('category', 'ilike', $cat);
        if ($s = $request->get('q')) $q->where(fn ($w) => $w->where('title', 'ilike', "%{$s}%")->orWhere('excerpt', 'ilike', "%{$s}%"));
        return $this->ok($q->get());
    }

    public function articleDetail(string $slug): JsonResponse
    {
        $a = Article::with('author:id,name')->where('slug', $slug)->where('status', 'published')->first();
        return $a ? $this->ok($a) : $this->fail('Artikel tidak ditemukan.', 404);
    }

    public function settings(): JsonResponse
    {
        return $this->ok(Setting::pluck('value', 'key'));
    }
}
