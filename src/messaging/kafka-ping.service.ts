import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { Consumer, EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { isPingEvent } from './ping-event';

const PING_TOPIC = 'poc.ping';
const DLQ_TOPIC = 'poc.ping.dlq';

@Injectable()
export class KafkaPingService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaPingService.name);
  private readonly processedEventIds = new Set<string>();
  private producer?: Producer;
  private consumer?: Consumer;
  private stopping = false;
  private retryTask?: Promise<void>;

  constructor(private readonly config: ConfigService) {}

  onApplicationBootstrap(): void {
    this.stopping = false;
    this.retryTask = this.connectWithRetry();
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;
    await this.consumer?.stop();
    await this.consumer?.disconnect();
    await this.producer?.disconnect();
    await this.retryTask;
  }

  private async connectWithRetry(): Promise<void> {
    let waitMs = 1000;
    while (!this.stopping) {
      try {
        await this.connect();
        return;
      } catch (error) {
        if (this.stopping) return;
        const detail = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Kafka unavailable; retrying in ${waitMs}ms: ${detail}`,
        );
        await this.releaseClients();
        await delay(waitMs);
        waitMs = Math.min(waitMs * 2, 30000);
      }
    }
  }

  private async connect(): Promise<void> {
    const brokers = this.config
      .get<string>('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092')
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean);
    if (brokers.length === 0) {
      throw new Error('KAFKA_BOOTSTRAP_SERVERS must contain a broker');
    }

    const kafka = new Kafka({
      clientId: 'casos-service',
      brokers,
      retry: { initialRetryTime: 500, retries: 1 },
    });
    this.producer = kafka.producer();
    this.consumer = kafka.consumer({
      groupId: this.config.get<string>('KAFKA_GROUP_ID', 'casos-service'),
    });

    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: PING_TOPIC, fromBeginning: true });

    if (this.config.get<string>('KAFKA_POC_PING_ON_START') === 'true') {
      await this.publishStartupPing();
    }

    await this.consumer.run({
      autoCommit: false,
      eachMessage: (message) => this.handleMessage(message),
    });
    this.logger.log(`Kafka consumer ready for ${PING_TOPIC}`);
  }

  private async publishStartupPing(): Promise<void> {
    const event = {
      eventId: randomUUID(),
      correlationId: randomUUID(),
      occurredAt: new Date().toISOString(),
      payload: { message: 'ping from casos-service' },
    };
    await this.producer!.send({
      topic: PING_TOPIC,
      messages: [{ key: event.correlationId, value: JSON.stringify(event) }],
    });
    this.logger.log(
      `Kafka ping published eventId=${event.eventId} correlationId=${event.correlationId}`,
    );
  }

  private async handleMessage({
    topic,
    partition,
    message,
  }: EachMessagePayload): Promise<void> {
    const value = message.value?.toString('utf8') ?? '';
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      await this.publishInvalidMessage(
        topic,
        partition,
        message.offset,
        message.key,
        message.value,
        'invalid JSON',
      );
      return;
    }

    if (!isPingEvent(parsed)) {
      await this.publishInvalidMessage(
        topic,
        partition,
        message.offset,
        message.key,
        message.value,
        'message does not match ping.v1 schema',
      );
      return;
    }

    if (this.processedEventIds.has(parsed.eventId)) {
      this.logger.warn(`Duplicate ping ignored eventId=${parsed.eventId}`);
    } else {
      this.processedEventIds.add(parsed.eventId);
      this.logger.log(
        `ping recibido eventId=${parsed.eventId} correlationId=${parsed.correlationId}`,
      );
    }
    await this.commit(topic, partition, message.offset);
  }

  private async publishInvalidMessage(
    topic: string,
    partition: number,
    offset: string,
    key: Buffer | null,
    value: Buffer | null,
    reason: string,
  ): Promise<void> {
    await this.producer!.send({
      topic: DLQ_TOPIC,
      messages: [
        {
          key,
          value,
          headers: { reason: Buffer.from(reason) },
        },
      ],
    });
    this.logger.warn(`Invalid Kafka event sent to ${DLQ_TOPIC}: ${reason}`);
    await this.commit(topic, partition, offset);
  }

  private async commit(
    topic: string,
    partition: number,
    offset: string,
  ): Promise<void> {
    await this.consumer!.commitOffsets([
      { topic, partition, offset: (BigInt(offset) + 1n).toString() },
    ]);
  }

  private async releaseClients(): Promise<void> {
    const consumer = this.consumer;
    const producer = this.producer;
    this.consumer = undefined;
    this.producer = undefined;
    await consumer?.stop();
    await consumer?.disconnect();
    await producer?.disconnect();
  }
}
