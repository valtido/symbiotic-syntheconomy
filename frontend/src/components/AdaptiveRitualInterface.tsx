import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserContext } from '../context/UserContext';
import { Ritual } from '../types/Ritual';

interface AdaptiveRitualInterfaceProps {
  rituals: Ritual[];
  onSubmit: (ritual: Partial<Ritual>) => void;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  layout: 'compact' | 'spacious';
  accessibility: {
    highContrast: boolean;
    screenReader: boolean;
    keyboardNav: boolean;
  };
}

const AdaptiveRitualInterface: React.FC<AdaptiveRitualInterfaceProps> = ({ rituals, onSubmit }) => {
  const { user } = useContext(UserContext);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    fontSize: 'medium',
    layout: 'spacious',
    accessibility: {
      highContrast: false,
      screenReader: false,
      keyboardNav: true,
    },
  });
  const [contextualMode, setContextualMode] = useState<'create' | 'view'>('view');
  const [formData, setFormData] = useState<Partial<Ritual>>({});

  // Load user preferences from localStorage or context
  useEffect(() => {
    const savedPreferences = localStorage.getItem(`preferences_${user?.id}`);
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, [user]);

  // Save preferences when they change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`preferences_${user.id}`, JSON.stringify(preferences));
    }
  }, [preferences, user]);

  // Adaptive theme handling
  const getThemeClass = () => {
    if (preferences.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-mode' : 'light-mode';
    }
    return `${preferences.theme}-mode`;
  };

  // Adaptive font size handling
  const getFontSizeClass = () => `font-size-${preferences.fontSize}`;

  // Adaptive layout handling
  const getLayoutClass = () => `layout-${preferences.layout}`;

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({});
    setContextualMode('view');
  };

  // Handle preference changes
  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Accessibility attributes
  const accessibilityProps = {
    'aria-label': 'Ritual Interface',
    tabIndex: preferences.accessibility.keyboardNav ? 0 : undefined,
    role: 'region',
  };

  return (
    <motion.div
      className={`adaptive-interface ${getThemeClass()} ${getFontSizeClass()} ${getLayoutClass()} ${preferences.accessibility.highContrast ? 'high-contrast' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      {...accessibilityProps}
    >
      {/* Preference Controls */}
      <div className="preference-controls" role="toolbar" aria-label="Interface preferences">
        <select
          value={preferences.theme}
          onChange={e => updatePreference('theme', e.target.value as 'light' | 'dark' | 'system')}
          aria-label="Theme selection"
        >
          <option value="light">Light Theme</option>
          <option value="dark">Dark Theme</option>
          <option value="system">System Default</option>
        </select>
        <select
          value={preferences.fontSize}
          onChange={e => updatePreference('fontSize', e.target.value as 'small' | 'medium' | 'large')}
          aria-label="Font size selection"
        >
          <option value="small">Small Font</option>
          <option value="medium">Medium Font</option>
          <option value="large">Large Font</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={preferences.accessibility.highContrast}
            onChange={e => updatePreference('accessibility', {
              ...preferences.accessibility,
              highContrast: e.target.checked
            })}
          />
          High Contrast
        </label>
      </div>

      {/* Contextual Mode Switch */}
      <div className="mode-switch" role="tablist">
        <button
          role="tab"
          aria-selected={contextualMode === 'view'}
          onClick={() => setContextualMode('view')}
        >
          View Rituals
        </button>
        <button
          role="tab"
          aria-selected={contextualMode === 'create'}
          onClick={() => setContextualMode('create')}
        >
          Create Ritual
        </button>
      </div>

      {/* Content based on mode */}
      <AnimatePresence mode="wait">
        {contextualMode === 'create' ? (
          <motion.form
            key="create-form"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            onSubmit={handleSubmit}
            role="form"
            aria-label="Create new ritual"
          >
            <input
              type="text"
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ritual Title"
              required
              aria-required="true"
            />
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ritual Description"
              required
              aria-required="true"
            />
            <button type="submit">Submit Ritual</button>
          </motion.form>
        ) : (
          <motion.div
            key="view-list"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            role="grid"
            aria-label="Ritual list"
          >
            {rituals.length > 0 ? (
              rituals.map(ritual => (
                <div key={ritual.id} className="ritual-item" role="gridcell">
                  <h3>{ritual.title}</h3>
                  <p>{ritual.description}</p>
                </div>
              ))
            ) : (
              <p>No rituals available.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdaptiveRitualInterface;
