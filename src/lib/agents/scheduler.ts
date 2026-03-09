import { runWeeklyReport, runDailyCheck } from './company/ceo';
import { runModelScout } from './company/pod-factory';
import { generateOutreachBatch } from './company/sales';
import { generateContentCalendar } from './company/marketing';
import { runDailyCostSummary, runWeeklyFinancialReport } from './company/finance';
import { generateGrowthReport } from './company/customer-success';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../supabase';

export type ScheduleKey =
  | 'ceo_weekly'
  | 'ceo_daily'
  | 'model_scout'
  | 'sales_outreach'
  | 'marketing_content'
  | 'marketing_seo'
  | 'finance_daily'
  | 'finance_weekly'
  | 'cs_growth_report';

interface ScheduleConfig {
  key: ScheduleKey;
  label: string;
  description: string;
  frequency: string;
  agentType: string;
}

export const SCHEDULE_CONFIG: ScheduleConfig[] = [
  { key: 'ceo_weekly', label: 'CEO Weekly Report', description: 'Full platform review with metrics, director summaries, and recommendations', frequency: 'Every Sunday', agentType: 'ceo' },
  { key: 'ceo_daily', label: 'CEO Daily Check', description: 'Quick status check — tasks, costs, alerts', frequency: 'Daily', agentType: 'ceo' },
  { key: 'model_scout', label: 'Model Scout', description: 'Review model assignments and suggest optimizations', frequency: 'Every Sunday', agentType: 'pod_factory' },
  { key: 'sales_outreach', label: 'Sales Outreach Batch', description: 'Generate outreach drafts for founder review', frequency: 'Daily', agentType: 'sales' },
  { key: 'marketing_content', label: 'Content Calendar', description: 'Weekly content plan across all channels', frequency: 'Weekly (Monday)', agentType: 'marketing' },
  { key: 'finance_daily', label: 'Finance Daily Summary', description: 'API cost breakdown and anomaly alerts', frequency: 'Daily', agentType: 'finance' },
  { key: 'finance_weekly', label: 'Finance Weekly Report', description: 'Full financial report with trends and projections', frequency: 'Weekly', agentType: 'finance' },
  { key: 'cs_growth_report', label: 'Growth Report', description: 'Monthly usage insights and value delivered', frequency: 'Monthly', agentType: 'customer_success' },
];

/**
 * Run a specific scheduled agent by key.
 * Returns the output and cost for logging.
 */
export async function runScheduledAgent(key: ScheduleKey): Promise<{ output: string; costUsd: number }> {
  const startTime = Date.now();

  let output = '';
  let costUsd = 0;

  switch (key) {
    case 'ceo_weekly': {
      const r = await runWeeklyReport();
      output = r.report; costUsd = r.costUsd;
      break;
    }
    case 'ceo_daily': {
      const r = await runDailyCheck();
      output = r.report; costUsd = r.costUsd;
      break;
    }
    case 'model_scout': {
      const r = await runModelScout();
      output = r.report; costUsd = r.costUsd;
      break;
    }
    case 'sales_outreach': {
      const r = await generateOutreachBatch('Generate outreach for potential AIpods customers — target SMBs and agencies that could benefit from AI agent teams.');
      output = r.drafts.map((d) => `[${d.type}] ${d.targetDescription}\n${d.subject ? `Subject: ${d.subject}\n` : ''}${d.body}`).join('\n\n---\n\n');
      costUsd = r.costUsd;
      break;
    }
    case 'marketing_content': {
      const r = await generateContentCalendar('AI agents for business, lead generation, marketing automation, SMB growth');
      output = r.pieces.map((p) => `[${p.type}] ${p.title}${p.channel ? ` (${p.channel})` : ''}\n${p.content}`).join('\n\n---\n\n');
      costUsd = r.costUsd;
      break;
    }
    case 'finance_daily': {
      const r = await runDailyCostSummary();
      output = r.summary + (r.alerts.length > 0 ? `\n\nALERTS:\n${r.alerts.join('\n')}` : '');
      costUsd = r.costUsd;
      break;
    }
    case 'finance_weekly': {
      const r = await runWeeklyFinancialReport();
      output = r.report; costUsd = r.costUsd;
      break;
    }
    case 'cs_growth_report': {
      const r = await generateGrowthReport();
      output = r.report; costUsd = r.costUsd;
      break;
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServiceClient();
      const config = SCHEDULE_CONFIG.find((s) => s.key === key);
      await supabase.from('agent_runs').insert({
        agent_type: config?.agentType ?? key,
        status: 'completed',
        model_used: 'scheduled',
        tokens_used: 0,
        cost_usd: costUsd,
        input_json: { schedule_key: key },
        output_json: { output_length: output.length, duration_ms: Date.now() - startTime },
      });
    } catch { /* non-critical */ }
  }

  return { output, costUsd };
}
