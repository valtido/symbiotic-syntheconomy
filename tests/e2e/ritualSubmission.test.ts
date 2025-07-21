import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Define file paths for test assets
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const validGrcFile = join(__dirname, '../../test-assets/valid-ritual.grc');
const invalidGrcFile = join(__dirname, '../../test-assets/invalid-ritual.grc');

test.describe('Ritual Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the ritual submission page before each test
    await page.goto('/ritual-submission');
    await page.waitForSelector('#submission-form', { state: 'visible' });
  });

  test('should successfully submit a valid .grc file through full flow', async ({ page }) => {
    // Step 1: Upload valid .grc file
    const fileInput = page.locator('#grc-file-input');
    await fileInput.setInputFiles(validGrcFile);
    await expect(page.locator('#upload-status')).toHaveText('File uploaded successfully', { timeout: 5000 });

    // Step 2: Validate through AI filters
    await page.click('#validate-btn');
    await expect(page.locator('#validation-status')).toHaveText('AI Validation Passed', { timeout: 10000 });

    // Step 3: Store on IPFS
    await page.click('#store-ipfs-btn');
    await expect(page.locator('#ipfs-status')).toHaveText('Stored on IPFS', { timeout: 15000 });
    const ipfsHash = await page.locator('#ipfs-hash').textContent();
    expect(ipfsHash).toBeDefined();
    expect(ipfsHash).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/); // Basic IPFS hash format check

    // Step 4: Log to blockchain
    await page.click('#log-blockchain-btn');
    await expect(page.locator('#blockchain-status')).toHaveText('Logged to Blockchain', { timeout: 20000 });
    const txHash = await page.locator('#transaction-hash').textContent();
    expect(txHash).toBeDefined();
    expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/); // Basic Ethereum transaction hash format check

    // Final success message
    await expect(page.locator('#submission-result')).toHaveText('Ritual Submission Completed Successfully', { timeout: 5000 });
  });

  test('should fail submission with invalid .grc file', async ({ page }) => {
    // Upload invalid .grc file
    const fileInput = page.locator('#grc-file-input');
    await fileInput.setInputFiles(invalidGrcFile);
    await expect(page.locator('#upload-status')).toHaveText('File uploaded successfully', { timeout: 5000 });

    // AI validation should fail
    await page.click('#validate-btn');
    await expect(page.locator('#validation-status')).toHaveText('AI Validation Failed', { timeout: 10000 });
    await expect(page.locator('#validation-error')).toHaveText(/Invalid ritual format/, { timeout: 5000 });

    // Subsequent steps should be disabled
    await expect(page.locator('#store-ipfs-btn')).toBeDisabled();
    await expect(page.locator('#log-blockchain-btn')).toBeDisabled();
  });

  test('should handle IPFS storage failure', async ({ page }) => {
    // Mock IPFS failure scenario (assuming API mocking or test env setup)
    await page.route('**/ipfs/store', route => route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'IPFS storage failed' }),
    }));

    // Upload valid file and pass validation
    const fileInput = page.locator('#grc-file-input');
    await fileInput.setInputFiles(validGrcFile);
    await expect(page.locator('#upload-status')).toHaveText('File uploaded successfully', { timeout: 5000 });
    await page.click('#validate-btn');
    await expect(page.locator('#validation-status')).toHaveText('AI Validation Passed', { timeout: 10000 });

    // IPFS storage should fail
    await page.click('#store-ipfs-btn');
    await expect(page.locator('#ipfs-status')).toHaveText('IPFS Storage Failed', { timeout: 15000 });
    await expect(page.locator('#ipfs-error')).toHaveText(/IPFS storage failed/, { timeout: 5000 });

    // Blockchain step should be disabled
    await expect(page.locator('#log-blockchain-btn')).toBeDisabled();
  });

  test('should handle blockchain logging failure', async ({ page }) => {
    // Mock blockchain failure scenario
    await page.route('**/blockchain/log', route => route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Blockchain logging failed' }),
    }));

    // Upload valid file, pass validation, and IPFS storage
    const fileInput = page.locator('#grc-file-input');
    await fileInput.setInputFiles(validGrcFile);
    await expect(page.locator('#upload-status')).toHaveText('File uploaded successfully', { timeout: 5000 });
    await page.click('#validate-btn');
    await expect(page.locator('#validation-status')).toHaveText('AI Validation Passed', { timeout: 10000 });
    await page.click('#store-ipfs-btn');
    await expect(page.locator('#ipfs-status')).toHaveText('Stored on IPFS', { timeout: 15000 });

    // Blockchain logging should fail
    await page.click('#log-blockchain-btn');
    await expect(page.locator('#blockchain-status')).toHaveText('Blockchain Logging Failed', { timeout: 20000 });
    await expect(page.locator('#blockchain-error')).toHaveText(/Blockchain logging failed/, { timeout: 5000 });
  });

  test('should display error for unsupported file type', async ({ page }) => {
    // Upload unsupported file type (e.g., .txt)
    const unsupportedFile = join(__dirname, '../../test-assets/unsupported.txt');
    const fileInput = page.locator('#grc-file-input');
    await fileInput.setInputFiles(unsupportedFile);
    await expect(page.locator('#upload-status')).toHaveText('Unsupported file type', { timeout: 5000 });
    await expect(page.locator('#upload-error')).toHaveText(/Only .grc files are supported/, { timeout: 5000 });

    // Subsequent steps should be disabled
    await expect(page.locator('#validate-btn')).toBeDisabled();
  });

  test('should handle empty file upload', async ({ page }) => {
    // Upload empty file
    const emptyFile = join(__dirname, '../../test-assets/empty.grc');
    const fileInput = page.locator('#grc-file-input');
    await fileInput.setInputFiles(emptyFile);
    await expect(page.locator('#upload-status')).toHaveText('File is empty', { timeout: 5000 });
    await expect(page.locator('#upload-error')).toHaveText(/File cannot be empty/, { timeout: 5000 });

    // Subsequent steps should be disabled
    await expect(page.locator('#validate-btn')).toBeDisabled();
  });
});