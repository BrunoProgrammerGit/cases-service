import { Injectable } from '@nestjs/common';

interface RequestSample {
  method: string;
  uri: string;
  status: string;
  count: number;
  sum: number;
  buckets: number[];
}

const application = 'cases-service';
const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];
const metricName = 'http_server_requests_seconds';
const contentType = 'text/plain; version=0.0.4; charset=utf-8';

@Injectable()
export class HttpMetricsService {
  private readonly samples = new Map<string, RequestSample>();

  observeRequest(method: string, uri: string, status: number, durationSeconds: number): void {
    const labels = { method, uri, status: String(status) };
    const key = JSON.stringify(labels);
    const sample = this.samples.get(key) ?? {
      ...labels,
      count: 0,
      sum: 0,
      buckets: buckets.map(() => 0),
    };
    const duration = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0;

    sample.count += 1;
    sample.sum += duration;
    buckets.forEach((upperBound, index) => {
      if (duration <= upperBound) sample.buckets[index] += 1;
    });
    this.samples.set(key, sample);
  }

  metrics(): string {
    const lines = [
      `# HELP ${metricName} HTTP server request duration in seconds`,
      `# TYPE ${metricName} histogram`,
    ];

    for (const sample of this.samples.values()) {
      const baseLabels = `application="${escapeLabel(application)}",method="${escapeLabel(sample.method)}",uri="${escapeLabel(sample.uri)}",status="${escapeLabel(sample.status)}"`;
      buckets.forEach((upperBound, index) => {
        lines.push(`${metricName}_bucket{${baseLabels},le="${upperBound}"} ${sample.buckets[index]}`);
      });
      lines.push(`${metricName}_bucket{${baseLabels},le="+Inf"} ${sample.count}`);
      lines.push(`${metricName}_sum{${baseLabels}} ${sample.sum}`);
      lines.push(`${metricName}_count{${baseLabels}} ${sample.count}`);
    }

    return `${lines.join('\n')}\n`;
  }

  get contentType(): string {
    return contentType;
  }
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}
