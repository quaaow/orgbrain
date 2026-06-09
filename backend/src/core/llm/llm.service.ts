import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, isAxiosError } from 'axios';
import { AppConfigService } from '../../config/app-config.service';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const TIMEOUT_MS = 120_000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3_000;

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: Record<string, unknown>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Async OpenRouter API client for LLM chat completions.
 *
 * Retries up to 3 times on HTTP 429 (rate limit) with a 2-second backoff.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private client: AxiosInstance | null = null;

  constructor(private readonly config: AppConfigService) {}

  private getClient(): AxiosInstance {
    if (!this.client) {
      this.client = axios.create({
        baseURL: OPENROUTER_BASE_URL,
        timeout: TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${this.config.openrouterApiKey}`,
          'HTTP-Referer': 'https://orgbrain.io',
          'X-Title': 'OrgBrain',
          'Content-Type': 'application/json',
        },
        // Don't throw on 429 so we can implement custom retry logic.
        validateStatus: (status) => status < 500 || status === 429,
      });
    }
    return this.client;
  }

  /**
   * Lightweight connectivity check used by the deep health endpoint. Hits the
   * models listing (no tokens consumed) with a short timeout.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.getClient().get('/models', { timeout: 5_000 });
      return res.status < 400;
    } catch {
      return false;
    }
  }

  /**
   * Send a chat completion request to OpenRouter and return the reply text.
   */
  async chatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {},
  ): Promise<string> {
    const payload: Record<string, unknown> = {
      model: options.model ?? this.config.chatModel,
      messages,
      temperature: options.temperature ?? 0.7,
    };
    if (options.maxTokens !== undefined) {
      payload.max_tokens = options.maxTokens;
    }
    if (options.responseFormat !== undefined) {
      payload.response_format = options.responseFormat;
    }

    const client = this.getClient();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await client.post('/chat/completions', payload);

        if (response.status === 429) {
          if (attempt < MAX_RETRIES) {
            this.logger.warn(
              `OpenRouter rate limit hit (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS / 1000}s...`,
            );
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          this.logger.error(
            `OpenRouter rate limit exceeded after ${MAX_RETRIES} retries`,
          );
          throw new Error('OpenRouter rate limit exceeded');
        }

        if (response.status >= 400) {
          this.logger.error(
            `OpenRouter HTTP error ${response.status}: ${JSON.stringify(response.data)}`,
          );
          throw new Error(`OpenRouter HTTP error ${response.status}`);
        }

        const choice = response.data?.choices?.[0];
        if (!choice?.message?.content) {
          this.logger.error(
            `OpenRouter returned empty choices: ${JSON.stringify(response.data)}`,
          );
          throw new Error('OpenRouter returned empty response');
        }

        return choice.message.content as string;
      } catch (error) {
        if (isAxiosError(error)) {
          this.logger.error(`OpenRouter request error: ${error.message}`);
        }
        throw error;
      }
    }

    throw new Error(
      'chatCompletion: exceeded max retries without a response',
    );
  }
}
