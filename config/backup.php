<?php

return [
    // Folder tujuan backup. Path relatif diresolve dari root project.
    'path' => env('BACKUP_PATH', 'storage/app/backups'),

    // Jumlah backup terbaru yang dipertahankan.
    'retention' => (int) (env('BACKUP_RETENTION', 14) ?: 14),
];
