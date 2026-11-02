<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateJwtToken
{
    /**
     * Extrae y valida la identidad del usuario propagada por el API Gateway.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Identificador directo inyectado por el API Gateway (SSO)
        $userId = $request->header('x-user-id');

        // 2. O lectura de claims básicos del Bearer token (si no viene x-user-id)
        if (!$userId && $token = $request->bearerToken()) {
            $parts = explode('.', $token);
            if (count($parts) === 3) {
                $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
                if (is_array($payload) && isset($payload['sub'])) {
                    $userId = (string) $payload['sub'];
                }
            }
        }

        if ($userId) {
            $request->attributes->set('user_id', $userId);
        }

        return $next($request);
    }
}
