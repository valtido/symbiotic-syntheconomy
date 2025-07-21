// Ritual Analytics Dashboard for Symbiotic Syntheconomy
// Purpose: Track and visualize ritual participation, success rates, and trends

import * as fs from 'fs';
import * as path from 'path';

// Define interfaces for ritual data
interface Ritual {
  id: string;
  name: string;
  date: string; // ISO format: YYYY-MM-DDTHH:MM:SSZ
  participants: number;
  successful: boolean;
  duration: number; // in minutes
  category: string;
}

interface AnalyticsSummary {
  totalRituals: number;
  successRate: number; // percentage
  avgParticipants: number;
  avgDuration: number; // in minutes
  categoryBreakdown: Record<string, number>;
  trendData: Record<string, number>; // Rituals per month
}

class RitualAnalytics {
  private data: Ritual[] = [];
  private dataFilePath: string;

  constructor(dataPath: string = './ritualData.json') {
    this.dataFilePath = path.resolve(dataPath);
    this.loadData();
  }

  // Load data from file
  private loadData(): void {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const rawData = fs.readFileSync(this.dataFilePath, 'utf-8');
        this.data = JSON.parse(rawData);
        console.log(`Loaded ${this.data.length} ritual records.`);
      } else {
        console.log('No existing data file found. Starting with empty dataset.');
        this.data = [];
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = [];
    }
  }

  // Save data to file
  private saveData(): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
      console.log('Data saved successfully.');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Add a new ritual record
  public addRitual(ritual: Omit<Ritual, 'id'>): void {
    const newRitual: Ritual = {
      ...ritual,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    this.data.push(newRitual);
    this.saveData();
    console.log(`Added ritual: ${newRitual.name}`);
  }

  // Calculate analytics summary
  public getAnalyticsSummary(): AnalyticsSummary {
    if (this.data.length === 0) {
      return {
        totalRituals: 0,
        successRate: 0,
        avgParticipants: 0,
        avgDuration: 0,
        categoryBreakdown: {},
        trendData: {},
      };
    }

    const totalRituals = this.data.length;
    const successfulRituals = this.data.filter(r => r.successful).length;
    const successRate = (successfulRituals / totalRituals) * 100;
    const avgParticipants = this.data.reduce((sum, r) => sum + r.participants, 0) / totalRituals;
    const avgDuration = this.data.reduce((sum, r) => sum + r.duration, 0) / totalRituals;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    this.data.forEach(ritual => {
      categoryBreakdown[ritual.category] = (categoryBreakdown[ritual.category] || 0) + 1;
    });

    // Trend data by month
    const trendData: Record<string, number> = {};
    this.data.forEach(ritual => {
      const month = ritual.date.slice(0, 7); // YYYY-MM
      trendData[month] = (trendData[month] || 0) + 1;
    });

    return {
      totalRituals,
      successRate,
      avgParticipants,
      avgDuration,
      categoryBreakdown,
      trendData,
    };
  }

  // Generate a simple text-based visualization
  public visualizeTrends(): string {
    const summary = this.getAnalyticsSummary();
    let output = '\n=== Ritual Analytics Dashboard ===\n\n';

    output += `Total Rituals: ${summary.totalRituals}\n`;
    output += `Success Rate: ${summary.successRate.toFixed(2)}%\n`;
    output += `Average Participants: ${summary.avgParticipants.toFixed(2)}\n`;
    output += `Average Duration: ${summary.avgDuration.toFixed(2)} minutes\n`;

    output += '\nCategory Breakdown:\n';
    for (const [category, count] of Object.entries(summary.categoryBreakdown)) {
      output += `  - ${category}: ${count} rituals\n`;
    }

    output += '\nMonthly Trends:\n';
    for (const [month, count] of Object.entries(summary.trendData)) {
      output += `  - ${month}: ${count} rituals\n`;
    }

    output += '\n=================================\n';
    return output;
  }

  // Export data as CSV for external visualization tools
  public exportToCSV(filePath: string = './ritualData.csv'): void {
    const header = 'ID,Name,Date,Participants,Successful,Duration,Category\n';
    const rows = this.data.map(ritual => {
      return `${ritual.id},${ritual.name},${ritual.date},${ritual.participants},${ritual.successful},${ritual.duration},${ritual.category}`;
    }).join('\n');

    fs.writeFileSync(filePath, header + rows, 'utf-8');
    console.log(`Data exported to ${filePath}`);
  }
}

// Example usage
if (require.main === module) {
  const analytics = new RitualAnalytics();

  // Add sample data if none exists
  if (analytics['data'].length === 0) {
    analytics.addRitual({
      name: 'Harvest Moon Ceremony',
      date: '2023-09-15T20:00:00Z',
      participants: 12,
      successful: true,
      duration: 120,
      category: 'Lunar',
    });
    analytics.addRitual({
      name: 'Solstice Gathering',
      date: '2023-06-21T18:00:00Z',
      participants: 8,
      successful: false,
      duration: 90,
      category: 'Solar',
    });
    analytics.addRitual({
      name: 'Equinox Ritual',
      date: '2023-03-20T19:30:00Z',
      participants: 15,
      successful: true,
      duration: 150,
      category: 'Seasonal',
    });
  }

  // Display analytics
  console.log(analytics.visualizeTrends());

  // Export data
  analytics.exportToCSV();
}

export default RitualAnalytics;
