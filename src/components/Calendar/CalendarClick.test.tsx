// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../../App';
import 'fake-indexeddb/auto';

describe('Calendar click test', () => {
  it('clicks on a calendar date and does not crash or throw', async () => {
    const { container } = render(<App />);

    // Wait for calendar cells to load after indexeddb initializes
    await waitFor(() => {
      const cells = container.querySelectorAll('.calendar-cell');
      expect(cells.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    const cells = container.querySelectorAll('.calendar-cell');
    console.log('Found loaded calendar cells:', cells.length);

    // Click on 5th cell
    const cell = cells[5];
    console.log('Clicking cell 5 with text:', cell.textContent);
    fireEvent.click(cell);

    // Wait for day-editor-sheet to appear
    await waitFor(() => {
      const editor = container.querySelector('.day-editor-sheet');
      expect(editor).not.toBeNull();
    });

    const editor = container.querySelector('.day-editor-sheet');
    console.log('DayEditor successfully appeared with title:', editor?.querySelector('.editor-date-title')?.textContent);
  });
});
