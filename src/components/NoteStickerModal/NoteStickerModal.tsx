import React from 'react';
import { JournalPageModal } from '../JournalPageModal/JournalPageModal';

interface NoteStickerModalProps {
  date: string;
  onClose: () => void;
}

/**
 * NoteStickerModal is unified with JournalPageModal into one cohesive
 * Scrapbook Journal & Note Page modal.
 */
export const NoteStickerModal: React.FC<NoteStickerModalProps> = ({ date, onClose }) => {
  return <JournalPageModal date={date} onClose={onClose} />;
};
