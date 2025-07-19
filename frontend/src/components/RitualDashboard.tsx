import { useState } from 'react';
import {
  Card,
  CardContent,
  Button,
  Typography,
  Grid,
  Box,
  Divider,
} from '@mui/material';

interface Ritual {
  id: string;
  bioregion: string;
  status: string;
  timestamp: string;
}

const rituals: Ritual[] = [
  {
    id: 'ritual-1',
    bioregion: 'Mythic Forest',
    status: 'Failed',
    timestamp: '2025-07-19T21:00:00Z',
  },
  {
    id: 'ritual-2',
    bioregion: 'Tech Haven',
    status: 'Complete',
    timestamp: '2025-07-19T21:10:00Z',
  },
];

export default function RitualDashboard() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Box p={4}>
      <Typography variant='h4' gutterBottom>
        Ritual Event Dashboard
      </Typography>
      <Divider sx={{ mb: 4 }} />

      <Grid container spacing={3}>
        {rituals.map((ritual) => (
          <Grid item xs={12} md={6} key={ritual.id} component='div'>
            <Card>
              <CardContent>
                <Typography variant='h6'>{ritual.bioregion}</Typography>
                <Typography>Status: {ritual.status}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {new Date(ritual.timestamp).toLocaleString()}
                </Typography>
                <Box mt={2}>
                  {ritual.status === 'Failed' ? (
                    <Button onClick={() => setSelected(ritual.id)}>
                      Retry Ritual
                    </Button>
                  ) : (
                    <Button variant='outlined' disabled>
                      Already Complete
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selected && (
        <Box mt={4}>
          <Typography variant='h6'>Initiating retry for: {selected}</Typography>
          {/* Replace with real contract handler */}
          <Button
            onClick={() => {
              console.log('Trigger retry for:', selected);
              setSelected(null);
            }}
            sx={{ mt: 2 }}
          >
            Confirm Retry
          </Button>
        </Box>
      )}
    </Box>
  );
}
