// ESEP (Ethical-Spiritual Evaluation Protocol) Filter
// Evaluates content for ethical and spiritual balance on a 0.0-1.0 scale

interface ESEPResult {
  score: number;
  ethicalScore: number;
  spiritualScore: number;
  balanceScore: number;
  feedback: string;
  passed: boolean;
}

// Ethical and Spiritual keyword lists for evaluation
const ethicalKeywords = ['justice', 'compassion', 'respect', 'fairness', 'kindness', 'empathy', 'integrity', 'honesty'];
const spiritualKeywords = ['sacred', 'divine', 'harmony', 'peace', 'spirit', 'soul', 'meditation', 'enlightenment'];

/**
 * Evaluates content based on Ethical-Spiritual Evaluation Protocol (ESEP)
 * @param content The text content to evaluate
 * @param maxThreshold Maximum allowed score threshold (default: 0.7)
 * @returns ESEPResult object with scores and feedback
 */
export function evaluateESEP(content: string, maxThreshold: number = 0.7): ESEPResult {
  // Normalize content to lowercase for matching
  const normalizedContent = content.toLowerCase();

  // Calculate ethical score based on keyword presence
  const ethicalMatches = ethicalKeywords.filter(keyword => normalizedContent.includes(keyword));
  const ethicalScore = Math.min(ethicalMatches.length / ethicalKeywords.length, 1.0);

  // Calculate spiritual score based on keyword presence
  const spiritualMatches = spiritualKeywords.filter(keyword => normalizedContent.includes(keyword));
  const spiritualScore = Math.min(spiritualMatches.length / spiritualKeywords.length, 1.0);

  // Calculate balance score (how close ethical and spiritual scores are to each other)
  const balanceScore = 1.0 - Math.abs(ethicalScore - spiritualScore);

  // Final score is a weighted average of ethical, spiritual, and balance scores
  const finalScore = (ethicalScore * 0.4) + (spiritualScore * 0.3) + (balanceScore * 0.3);

  // Determine if the content passes the threshold
  const passed = finalScore <= maxThreshold;

  // Generate detailed feedback
  let feedback = `ESEP Evaluation Results:\n`;
  feedback += `- Ethical Score: ${ethicalScore.toFixed(2)} (Keywords: ${ethicalMatches.length > 0 ? ethicalMatches.join(', ') : 'none'})\n`;
  feedback += `- Spiritual Score: ${spiritualScore.toFixed(2)} (Keywords: ${spiritualMatches.length > 0 ? spiritualMatches.join(', ') : 'none'})\n`;
  feedback += `- Balance Score: ${balanceScore.toFixed(2)} (Difference: ${Math.abs(ethicalScore - spiritualScore).toFixed(2)})\n`;
  feedback += `- Final Score: ${finalScore.toFixed(2)} (Threshold: ${maxThreshold.toFixed(2)})\n`;
  feedback += passed ? '✅ Content passes ESEP evaluation.' : '❌ Content exceeds threshold and fails ESEP evaluation.';

  return {
    score: finalScore,
    ethicalScore,
    spiritualScore,
    balanceScore,
    feedback,
    passed
  };
}

// Example usage for testing
if (require.main === module) {
  const testContent = "This text promotes justice, compassion, and divine harmony.";
  const result = evaluateESEP(testContent);
  console.log(result.feedback);
}
