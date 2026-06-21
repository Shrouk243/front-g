<?php

namespace App\Console\Commands;

use App\Services\TelegramBotService;
use Illuminate\Console\Command;

class TelegramPollCommand extends Command
{
    protected $signature = 'telegram:poll {--once : Fetch a single batch of updates and exit}';

    protected $description = 'Poll Telegram updates for local development';

    public function __construct(
        private readonly TelegramBotService $telegramBotService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        if (!$this->telegramBotService->isConfigured()) {
            $this->warn('TELEGRAM_BOT_TOKEN is not configured.');

            return self::FAILURE;
        }

        $offset = null;
        $runOnce = (bool) $this->option('once');

        do {
            $updates = $this->telegramBotService->getUpdates($offset);

            foreach ($updates as $update) {
                $this->telegramBotService->handleUpdate($update);
                $offset = ((int) ($update['update_id'] ?? 0)) + 1;
            }

            if ($runOnce) {
                break;
            }

            sleep((int) config('services.telegram.polling_sleep_seconds', 1));
        } while (true);

        return self::SUCCESS;
    }
}
