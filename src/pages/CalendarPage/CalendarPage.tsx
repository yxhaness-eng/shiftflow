import React from 'react';
import { CalendarView } from '../../components/Calendar/CalendarView';
import { DayEditor } from '../../components/DayEditor/DayEditor';

export const CalendarPage: React.FC = () => {
  return (
    <div className="calendar-page">
      <CalendarView />
      <DayEditor />
    </div>
  );
};

