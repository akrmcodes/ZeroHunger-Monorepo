<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response for API
     */
    public function render($request, Throwable $e)
    {
        // Return JSON for API requests
        if ($request->is('api/*')) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Handle API exceptions
     */
    protected function handleApiException($request, Throwable $exception)
    {
        $statusCode = 500;
        $message = 'Internal server error';

        if ($exception instanceof AuthenticationException) {
            $statusCode = 401;
            $message = 'Unauthenticated';
        } elseif ($exception instanceof ValidationException) {
            $statusCode = 422;
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $exception->errors(),
            ], $statusCode);
        } elseif ($exception instanceof NotFoundHttpException) {
            $statusCode = 404;
            $message = 'Resource not found';
        } elseif (method_exists($exception, 'getStatusCode')) {
            $statusCode = $exception->getStatusCode();
            $message = $exception->getMessage();
        }

        return response()->json([
            'message' => $message,
            'error' => config('app.debug') ? $exception->getMessage() : null,
        ], $statusCode);
    }
}
