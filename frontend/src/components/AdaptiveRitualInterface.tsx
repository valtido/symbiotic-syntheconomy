import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button, TextField, Typography, Slider, Checkbox, FormControlLabel, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import { UserContext } from '../contexts/UserContext';
import { RitualContext } from '../contexts/RitualContext';

interface UserPreferences {
  fontSize: number;
  highContrast: boolean;
  simplifiedView: boolean;
  preferredThemes: string[];
  interactionSpeed: number;
}

interface AdaptiveRitualInterfaceProps {
  ritualId?: string;
  onSubmit?: (data: any) => void;
}

const AdaptiveRitualInterface: React.FC<AdaptiveRitualInterfaceProps> = ({ ritualId, onSubmit }) => {
  const theme = useTheme();
  const { user, updateUserPreferences } = useContext(UserContext);
  const { currentRitual, updateRitualView } = useContext(RitualContext);

  // State for user preferences and ritual data
  const [preferences, setPreferences] = useState<UserPreferences>({
    fontSize: user?.preferences?.fontSize || 16,
    highContrast: user?.preferences?.highContrast || false,
    simplifiedView: user?.preferences?.simplifiedView || false,
    preferredThemes: user?.preferences?.preferredThemes || ['default'],
    interactionSpeed: user?.preferences?.interactionSpeed || 1,
  });

  const [ritualData, setRitualData] = useState({
    title: currentRitual?.title || '',
    description: currentRitual?.description || '',
    intensity: currentRitual?.intensity || 50,
  });

  // Update preferences based on user behavior and context
  useEffect(() => {
    if (user) {
      const updatedPreferences = analyzeUserBehavior(user);
      setPreferences(updatedPreferences);
      updateUserPreferences(updatedPreferences);
    }
  }, [user, updateUserPreferences]);

  // Adaptive UI styling based on preferences
  const adaptiveStyles = useMemo(() => ({
    container: {
      backgroundColor: preferences.highContrast ? '#000' : theme.palette.background.default,
      color: preferences.highContrast ? '#FFF' : theme.palette.text.primary,
      fontSize: `${preferences.fontSize}px`,
      padding: theme.spacing(3),
      borderRadius: theme.shape.borderRadius,
      transition: 'all 0.3s ease',
    },
    input: {
      marginBottom: theme.spacing(2),
      fontSize: `${preferences.fontSize}px`,
    },
    button: {
      marginTop: theme.spacing(2),
      transition: `all ${preferences.interactionSpeed}s ease`,
    },
  }), [preferences, theme]);

  // Handle preference changes
  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      updateUserPreferences(updated);
      return updated;
    });
  };

  // Handle ritual data changes
  const handleRitualChange = (key: string, value: any) => {
    setRitualData(prev => ({ ...prev, [key]: value }));
  };

  // Submit ritual data
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(ritualData);
    }
    updateRitualView(ritualData);
  };

  // Analyze user behavior for adaptive personalization
  const analyzeUserBehavior = (userData: any): UserPreferences => {
    // Simplified behavior analysis (can be enhanced with ML models)
    const timeOfDay = new Date().getHours();
    const highContrast = timeOfDay > 18 || timeOfDay < 6 ? true : preferences.highContrast;
    return { ...preferences, highContrast };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: preferences.interactionSpeed }}
      role="region"
      aria-label="Adaptive Ritual Interface"
    >
      <Box sx={adaptiveStyles.container}>
        <Typography variant="h5" gutterBottom>
          {ritualId ? 'Edit Ritual' : 'Create New Ritual'}
        </Typography>
        <Divider sx={{ my: 2 }} />

        {/* Ritual Form - Adapts based on simplifiedView */}
        {!preferences.simplifiedView && (
          <TextField
            fullWidth
            label="Ritual Title"
            value={ritualData.title}
            onChange={(e) => handleRitualChange('title', e.target.value)}
            sx={adaptiveStyles.input}
            inputProps={{ 'aria-label': 'Ritual Title' }}
          />
        )}
        <TextField
          fullWidth
          multiline
          rows={preferences.simplifiedView ? 2 : 4}
          label="Description"
          value={ritualData.description}
          onChange={(e) => handleRitualChange('description', e.target.value)}
          sx={adaptiveStyles.input}
          inputProps={{ 'aria-label': 'Ritual Description' }}
        />

        {!preferences.simplifiedView && (
          <Box sx={{ mt: 2 }}>
            <Typography>Intensity Level</Typography>
            <Slider
              value={ritualData.intensity}
              onChange={(_, value) => handleRitualChange('intensity', value)}
              min={0}
              max={100}
              valueLabelDisplay="auto"
              aria-label="Ritual Intensity Level"
            />
          </Box>
        )}

        {/* Accessibility Preferences */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1">Personalize Experience</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.highContrast}
                onChange={(_, checked) => handlePreferenceChange('highContrast', checked)}
              />
            }
            label="High Contrast Mode"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.simplifiedView}
                onChange={(_, checked) => handlePreferenceChange('simplifiedView', checked)}
              />
            }
            label="Simplified View"
          />
          <Box sx={{ mt: 1 }}>
            <Typography>Font Size</Typography>
            <Slider
              value={preferences.fontSize}
              onChange={(_, value) => handlePreferenceChange('fontSize', value)}
              min={12}
              max={24}
              valueLabelDisplay="auto"
              aria-label="Adjust Font Size"
            />
          </Box>
        </Box>

        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={adaptiveStyles.button}
          aria-label="Submit Ritual"
        >
          {ritualId ? 'Update Ritual' : 'Create Ritual'}
        </Button>
      </Box>
    </motion.div>
  );
};

export default AdaptiveRitualInterface;
