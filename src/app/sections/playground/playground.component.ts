import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cloudDownloadOutline,
  analyticsOutline,
  createOutline,
  newspaperOutline,
  playOutline,
  refreshOutline,
  sparklesOutline,
  checkmarkCircle,
} from 'ionicons/icons';

interface Model {
  id: string;
  label: string;
  short: string;
  cost: string;
  speed: number; // seconds-ish multiplier
  pass: number; // fraction of items that survive scoring + drafting
  scoreOffset: number; // applied to threshold; matches the real catalog idea
  gradient: string;
}

interface Stage {
  id: 'scrape' | 'analyze' | 'draft' | 'publish';
  label: string;
  icon: string;
}

type Phase = 'idle' | 'running' | 'done';

const MODELS: Model[] = [
  { id: 'sonnet',  label: 'Claude Sonnet 4.6', short: 'Sonnet', cost: '$0.04', speed: 1.0, pass: 0.72, scoreOffset: 0,  gradient: 'from-amber-500 to-rose-500' },
  { id: 'opus',    label: 'Claude Opus 4.7',   short: 'Opus',   cost: '$0.18', speed: 1.4, pass: 0.86, scoreOffset: +5, gradient: 'from-fuchsia-500 to-rose-500' },
  { id: 'haiku',   label: 'Claude Haiku 4.5',  short: 'Haiku',  cost: '$0.01', speed: 0.6, pass: 0.52, scoreOffset: -8, gradient: 'from-pink-500 to-amber-500' },
  { id: 'gpt5',    label: 'GPT-5',             short: 'GPT-5',  cost: '$0.06', speed: 1.0, pass: 0.70, scoreOffset: 0,  gradient: 'from-emerald-500 to-cyan-500' },
  { id: 'gemini',  label: 'Gemini 2.5',        short: 'Gemini', cost: '$0.02', speed: 0.7, pass: 0.62, scoreOffset: -3, gradient: 'from-sky-500 to-indigo-500' },
];

const STAGES: Stage[] = [
  { id: 'scrape',  label: 'Scrape',  icon: 'cloud-download-outline' },
  { id: 'analyze', label: 'Score',   icon: 'analytics-outline' },
  { id: 'draft',   label: 'Draft',   icon: 'create-outline' },
  { id: 'publish', label: 'Publish', icon: 'newspaper-outline' },
];

const SAMPLE_PROSE = (topic: string) =>
  `${topic} — a deeper look. The shift in the past year is less about raw model capability and more about how teams ` +
  `wire frontier models into ordinary workflows. Editorial teams are no longer asking whether AI can draft; they are ` +
  `asking how to make the drafts trustworthy enough to publish without fully rewriting them. This piece walks through ` +
  `what is changing, where the failures still are, and what a small team should look at before adopting an AI-first ` +
  `pipeline.`;

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  templateUrl: './playground.component.html',
})
export class PlaygroundComponent {
  protected readonly models = MODELS;
  protected readonly stages = STAGES;

  protected readonly topic = signal('AI safety in 2026');
  protected readonly modelId = signal<string>('sonnet');
  protected readonly threshold = signal<number>(72);

  protected readonly phase = signal<Phase>('idle');
  protected readonly currentStage = signal<number>(-1); // index into stages
  protected readonly stageStatus = signal<Record<Stage['id'], 'pending' | 'running' | 'done'>>({
    scrape: 'pending', analyze: 'pending', draft: 'pending', publish: 'pending',
  });

  protected readonly stats = signal({
    scraped: 0,
    analyzed: 0,
    drafted: 0,
    published: 0,
  });

  protected readonly draftText = signal('');
  protected readonly draftQuality = signal<number | null>(null);

  protected readonly selectedModel = computed<Model>(
    () => this.models.find((m) => m.id === this.modelId())!,
  );

  protected readonly effectiveThreshold = computed(
    () => Math.max(20, Math.min(95, this.threshold() + this.selectedModel().scoreOffset)),
  );

  protected readonly canRun = computed(() => this.phase() !== 'running');
  protected readonly hasRun = computed(() => this.phase() === 'done');

  private readonly destroyRef = inject(DestroyRef);
  private timeouts: ReturnType<typeof setTimeout>[] = [];
  private intervals: ReturnType<typeof setInterval>[] = [];

  constructor() {
    addIcons({
      cloudDownloadOutline,
      analyticsOutline,
      createOutline,
      newspaperOutline,
      playOutline,
      refreshOutline,
      sparklesOutline,
      checkmarkCircle,
    });

    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  setModel(id: string): void {
    if (this.phase() === 'running') return;
    this.modelId.set(id);
  }

  run(): void {
    this.clearTimers();
    this.reset(/* keepInputs */ true);
    this.phase.set('running');

    const model = this.selectedModel();
    const baseDelay = 650 * model.speed;

    const scraped = 36 + Math.floor(Math.random() * 16); // 36..52
    const passRate = Math.max(0.15, model.pass - (this.effectiveThreshold() - 60) / 200);
    const analyzed = scraped;
    const drafted = Math.max(1, Math.round(analyzed * passRate));
    const published = Math.max(1, Math.round(drafted * 0.85));

    this.runStage('scrape', baseDelay, () => this.tickTo('scraped', scraped, baseDelay * 0.6));
    this.scheduleAfter(baseDelay, () => {
      this.runStage('analyze', baseDelay, () => this.tickTo('analyzed', analyzed, baseDelay * 0.7));
    });
    this.scheduleAfter(baseDelay * 2, () => {
      this.runStage('draft', baseDelay * 1.2, () => this.tickTo('drafted', drafted, baseDelay * 0.8));
    });
    this.scheduleAfter(baseDelay * 3.2, () => {
      this.runStage('publish', baseDelay, () => this.tickTo('published', published, baseDelay * 0.5));
    });
    this.scheduleAfter(baseDelay * 4.2, () => {
      this.phase.set('done');
      this.draftQuality.set(this.effectiveThreshold() + Math.floor(Math.random() * 12));
      this.typewriter(SAMPLE_PROSE(this.topic().trim() || 'A topic'));
    });
  }

  reset(keepInputs = false): void {
    this.clearTimers();
    this.phase.set('idle');
    this.currentStage.set(-1);
    this.stageStatus.set({ scrape: 'pending', analyze: 'pending', draft: 'pending', publish: 'pending' });
    this.stats.set({ scraped: 0, analyzed: 0, drafted: 0, published: 0 });
    this.draftText.set('');
    this.draftQuality.set(null);
    if (!keepInputs) {
      this.topic.set('AI safety in 2026');
      this.modelId.set('sonnet');
      this.threshold.set(72);
    }
  }

  private runStage(id: Stage['id'], duration: number, onTick: () => void): void {
    const idx = this.stages.findIndex((s) => s.id === id);
    this.currentStage.set(idx);
    this.updateStageStatus(id, 'running');
    onTick();
    this.scheduleAfter(duration, () => this.updateStageStatus(id, 'done'));
  }

  private updateStageStatus(id: Stage['id'], status: 'pending' | 'running' | 'done'): void {
    this.stageStatus.update((s) => ({ ...s, [id]: status }));
  }

  private tickTo(field: keyof ReturnType<typeof this.stats>, target: number, duration: number): void {
    const start = this.stats()[field];
    const delta = target - start;
    const steps = 16;
    const each = duration / steps;
    for (let i = 1; i <= steps; i++) {
      const t = setTimeout(() => {
        const v = Math.round(start + (delta * i) / steps);
        this.stats.update((s) => ({ ...s, [field]: v }));
      }, each * i);
      this.timeouts.push(t);
    }
  }

  private typewriter(text: string): void {
    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(text.length, i + 4);
      this.draftText.set(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
    this.intervals.push(interval);
  }

  private scheduleAfter(ms: number, fn: () => void): void {
    this.timeouts.push(setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timeouts.forEach(clearTimeout);
    this.intervals.forEach(clearInterval);
    this.timeouts = [];
    this.intervals = [];
  }
}
