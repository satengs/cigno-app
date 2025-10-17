import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContentPart from '@/components/layout/ContentPart';

describe('ContentPart - deliverable storyline rendering', () => {
  const deliverableId = '68e6f4b15f19df3bca8ae523';
  const projectId = '68e58be74b473920ca8510b1';

  beforeEach(() => {
    global.fetch = jest.fn((input) => {
      const url = typeof input === 'string' ? input : input.url;

      if (url.includes('/api/storylines')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              storylines: [
                {
                  _id: 'storyline-1',
                  title: 'Classification Framework Storyline',
                  sections: [
                    {
                      id: 'executive-summary',
                      title: 'Executive Summary',
                      description: 'Overview of the classification framework',
                      status: 'draft',
                      keyPoints: ['Purpose and objectives'],
                    },
                    {
                      id: 'market-context',
                      title: 'Market Context & Analysis',
                      description: 'Detailed market assessment',
                      status: 'draft',
                      keyPoints: ['Digital transformation trends'],
                    },
                  ],
                },
              ],
              pagination: { page: 1, limit: 10, total: 1, pages: 1 },
            },
          }),
        });
      }

      if (url.includes(`/api/projects/${projectId}/deliverables`)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [] }),
        });
      }

      if (url.includes('/api/contacts')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { contacts: [] } }),
        });
      }

      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { users: [] } }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders persisted storyline sections when a deliverable is selected', async () => {
    const user = userEvent.setup();

    render(
      <ContentPart
        selectedItem={{
          type: 'deliverable',
          _id: deliverableId,
          id: deliverableId,
          title: 'Classification Framework of Disruptive Business Models',
          project: projectId,
          metadata: { project_id: projectId },
        }}
        onItemSelect={jest.fn()}
        onItemDeleted={jest.fn()}
        onDeliverableNavigate={jest.fn()}
        refreshFromDatabase={jest.fn()}
      />
    );

    const hasStorylineFetch = global.fetch.mock.calls.some((call) => {
      const [url] = call;
      return typeof url === 'string' && url.includes(`/api/storylines?deliverableId=${deliverableId}`);
    });

    expect(hasStorylineFetch).toBe(true);

    // Explicitly click the Storyline tab to mimic user intent
    const storylineTab = await screen.findByRole('button', { name: /^Storyline$/ });
    await user.click(storylineTab);

    expect(await screen.findByText('Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('Market Context & Analysis')).toBeInTheDocument();
  });
});
