<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Route::middleware('role:doctor|nurse') — izinkan super-admin selalu lolos.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        abort_unless($user && $user->is_active, 401, 'Unauthenticated.');

        if ($user->role !== 'super-admin' && ! in_array($user->role, $roles, true)) {
            abort(403, 'Akses ditolak: peran Anda tidak memiliki izin.');
        }

        return $next($request);
    }
}
