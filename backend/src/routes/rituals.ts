import { Router, Request, Response } from 'express';
import { create } from 'ipfs-http-client';
import { ethers } from 'ethers';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { validateRitualFile, aiFilter } from '../services/ritualService';
import { logToBlockchain } from '../services/blockchainService';
import { RitualSubmission } from '../models/Ritual';

const router = Router();

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.grc') {
      return cb(new Error('Only .grc files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Initialize IPFS client
const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

// POST /api/v1/rituals/submit
router.post('/submit', upload.single('ritualFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No .grc file uploaded' });
    }

    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Read the uploaded file
    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath);

    // Validate the .grc file structure
    const validationResult = validateRitualFile(fileContent);
    if (!validationResult.valid) {
      await fs.unlink(filePath);
      return res.status(400).json({ error: 'Invalid .grc file format', details: validationResult.errors });
    }

    // Process through AI filters
    const aiFilterResult = await aiFilter(fileContent.toString());
    if (!aiFilterResult.passed) {
      await fs.unlink(filePath);
      return res.status(403).json({ error: 'Ritual content failed AI filter', reasons: aiFilterResult.reasons });
    }

    // Upload to IPFS
    const ipfsResult = await ipfs.add(fileContent);
    const ipfsHash = ipfsResult.cid.toString();

    // Log to blockchain
    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const transactionHash = await logToBlockchain(wallet, {
      title,
      description,
      ipfsHash,
    });

    // Create ritual record in database
    const ritual = new RitualSubmission({
      title,
      description,
      ipfsHash,
      transactionHash,
      validationResults: validationResult,
      aiFilterResults: aiFilterResult,
    });
    await ritual.save();

    // Clean up temporary file
    await fs.unlink(filePath);

    // Return response
    res.status(201).json({
      ritualId: ritual._id,
      ipfsHash,
      transactionHash,
      validationResults: validationResult,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error('Error in ritual submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;