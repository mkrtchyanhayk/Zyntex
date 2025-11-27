import React from 'react';
import Modal from './Modal';

const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2025-11-25',
    changes: [
      'Profile Enhancements: Tabs for Posts, Liked, Comments, Settings',
      'Added Settings tab for profile editing',
      'Fixed Modal positioning (always centered)',
      'Theme Compatibility: Fixed text colors across all pages',
      'Improved UI/UX for light/dark modes'
    ]
  },
  { version: '1.0.0', date: '2025-11-21', changes: ['Initial release', 'Feed with reactions', 'DM system', 'Groups', 'User profiles', 'Follow system', 'GIF support'] },
  { version: '0.9.0', date: '2025-11-20', changes: ['Improved UI/UX', 'Fixed scroll behavior', 'Added theme support', 'Enhanced reactions display'] }
];

export default function Changelog({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="What's New">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto soft-scrollbar">
        {CHANGELOG.map((entry) => (
          <div key={entry.version} className="border-b border-white/10 pb-4 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-primary">Version {entry.version}</h3>
              <span className="text-xs text-secondary">{entry.date}</span>
            </div>
            <ul className="space-y-1 mt-2">
              {entry.changes.map((change, idx) => (
                <li key={idx} className="text-sm text-secondary flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}

