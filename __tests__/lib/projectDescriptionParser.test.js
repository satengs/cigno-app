/**
 * @jest-environment node
 */

import parseProjectDescription from '../../src/lib/parsers/projectDescriptionParser.js';

beforeAll(() => {
  jest.useFakeTimers({
    now: new Date('2025-01-15T00:00:00Z')
  });
});

afterAll(() => {
  jest.useRealTimers();
});

describe('parseProjectDescription', () => {
  it('extracts structured deliverables and dependencies from narrative input', () => {
    const description = [
      'The client Finews AG is launching a digital transformation strategy project with a focus on AI content generation and analytics automation.',
      'Project duration: November 1 – December 30, 2025.',
      'Budget: CHF 12,000, milestone-based.',
      'Objectives: Create a Content Strategy Dashboard using MongoDB and Next.js, Generate an AI-Powered Report Generator API integrated with Contentful, Deliver a Performance Summary Presentation (PPT) for stakeholders.',
      'The dashboard depends on the successful deployment of the API.'
    ].join(' ');

    const result = parseProjectDescription(description, {});

    expect(result).toMatchObject({
      currency: 'CHF',
      budget_type: 'Milestone',
      project_type: 'development',
      budget_amount: 12000
    });
    expect(result.start_date).toBe('2025-11-01');
    expect(result.end_date).toBe('2025-12-30');
    expect(result.tags).toEqual(expect.arrayContaining(['dashboard', 'api', 'presentation']));

    const dashboard = result.deliverables.find(item => item.title === 'Content Strategy Dashboard');
    const api = result.deliverables.find(item => item.title.startsWith('AI-Powered'));
    const presentation = result.deliverables.find(item => item.type === 'Presentation');

    expect(result.deliverables).toHaveLength(3);
    expect(dashboard).toBeDefined();
    expect(api).toBeDefined();
    expect(presentation).toBeDefined();

    expect(dashboard?.dependencies).toContain(api?.id);
    [dashboard, api, presentation].forEach(deliverable => {
      expect(deliverable.due_date).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(deliverable.metadata).toEqual(expect.objectContaining({
        format: expect.any(String),
        assigned_to: expect.any(String),
        expected_output: expect.any(String)
      }));
    });
  });

  it('merges explicit JSON deliverables without duplication and preserves metadata', () => {
    const description = 'Prepare risk assessment report for the board and draft a compliance playbook for the rollout.';
    const existing = {
      deliverables: [
        {
          id: 'risk-assessment-report',
          title: 'Risk Assessment Report',
          type: 'Report',
          status: 'Completed',
          due_date: '2025-03-10',
          metadata: {
            format: 'pdf',
            assigned_to: 'Risk Team Lead'
          }
        }
      ]
    };

    const result = parseProjectDescription(description, existing);
    const ids = result.deliverables.map(item => item.id);

    expect(new Set(ids).size).toBe(ids.length);

    const report = result.deliverables.find(item => item.title === 'Risk Assessment Report');
    const playbook = result.deliverables.find(item => item.title.includes('Playbook'));

    expect(report).toBeDefined();
    expect(report?.status).toBe('Completed');
    expect(report?.metadata.format).toBe('pdf');
    expect(playbook).toBeDefined();
    expect(playbook?.type).toBe('Documentation');
    expect(playbook?.status).toBe('Planned');
  });

  it('infers dates, currency and project type from contextual hints', () => {
    const description = [
      'We are kicking off a regulatory strategy engagement for our wealth management unit.',
      'Kickoff on March 5 with completion by April 20.',
      'Budget EUR 3,500 on a retainer basis.',
      'Key action: prepare an onboarding brief for the new compliance team.'
    ].join(' ');

    const result = parseProjectDescription(description, {});

    expect(result.start_date).toBe('2025-03-05');
    expect(result.end_date).toBe('2025-04-20');
    expect(result.currency).toBe('EUR');
    expect(result.budget_type).toBe('Retainer');
    expect(result.project_type).toBe('strategy');
    expect(result.budget_amount).toBe(3500);

    const brief = result.deliverables.find(item => item.title.toLowerCase().includes('brief'));
    expect(brief).toBeDefined();
    expect(brief?.type).toBe('Brief');
  });
});
