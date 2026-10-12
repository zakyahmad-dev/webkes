<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Base API Controller — helper bersama untuk seluruh controller HealthHub.
 */
class ApiController
{
    /** Respons envelope seragam — identik dengan route handler Next.js. */
    protected function ok(mixed $data = null, ?string $message = null, int $status = 200): JsonResponse
    {
        $payload = ['success' => true];
        if ($message) $payload['message'] = $message;
        $payload['data'] = $data;
        return response()->json($payload, $status);
    }

    protected function fail(string $message, int $status = 400, mixed $errors = null): JsonResponse
    {
        $payload = ['success' => false, 'message' => $message];
        if ($errors) $payload['errors'] = $errors;
        return response()->json($payload, $status);
    }

    /** Guard peran granular per-controller (super-admin selalu lolos). */
    protected function requireRole(Request $request, array $roles): void
    {
        $user = $request->user();
        abort_unless($user && $user->is_active, 401, 'Unauthenticated.');
        abort_unless(
            $user->role === 'super-admin' || in_array($user->role, $roles, true),
            403,
            'Akses ditolak: peran tidak memiliki izin.'
        );
    }

    /** Audit trail immutable (UU PDP / Permenkes 24/2022). */
    protected function audit(
        Request $request,
        string $action,
        ?string $auditableType = null,
        ?int $auditableId = null,
        ?int $patientId = null,
        ?string $notes = null,
        ?array $old = null,
        ?array $new = null
    ): void {
        $user = $request->user();
        AuditLog::create([
            'user_id' => $user?->id,
            'role_snapshot' => $user?->role ?? 'guest',
            'action' => $action,
            'auditable_type' => $auditableType ?? 'System',
            'auditable_id' => $auditableId,
            'patient_id' => $patientId,
            'notes' => $notes,
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
            'url' => substr($request->fullUrl(), 0, 500),
        ]);
    }

    protected function dateCode(): string { return now()->format('Ymd'); }
}

class AuthController extends ApiController
{
    /** POST /api/auth/login — Sanctum token auth (gantikan mock auth Next.js). */
    public function login(Request $request): JsonResponse
    {
        $cred = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with(['patientRecord', 'doctorProfile'])->where('email', $cred['email'])->first();

        if (! $user || ! Hash::check($cred['password'], $user->password)) {
            $this->audit($request, 'AUTH_LOGIN_FAILED', 'User', $user?->id, null, 'Login gagal: kredensial salah.');
            return $this->fail('Email atau kata sandi salah.', 401);
        }
        abort_unless($user->is_active, 403, 'Akun dinonaktifkan.');

        $user->update(['last_login_at' => now(), 'last_login_ip' => $request->ip()]);
        $token = $user->createToken('healthhub-portal', ['role:' . $user->role])->plainTextToken;

        $this->audit($request, 'AUTH_LOGIN', 'User', $user->id, $user->patientRecord?->id, 'Login berhasil.');

        return $this->ok([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'avatarPath' => $user->avatar_path,
                'patientId' => $user->patientRecord?->id,
                'doctorId' => $user->doctorProfile?->id,
            ],
        ], 'Login berhasil.');
    }

    /** POST /api/auth/logout */
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();
        $this->audit($request, 'AUTH_LOGOUT', 'User', $request->user()?->id, null, 'Logout.');
        return $this->ok(null, 'Berhasil keluar.');
    }

    /** GET /api/auth/me */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['patientRecord', 'doctorProfile']);
        return $this->ok(['user' => $user]);
    }
}
