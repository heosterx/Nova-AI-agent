import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { supabase } from '../db/supabase';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { generateEmbedding, chunkText } from '../services/embedding';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(txt|md|pdf|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only TXT, MD, PDF, and DOCX files are allowed'));
    }
  },
});

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ files: data });
  } catch (err) {
    next(err);
  }
});

router.post('/upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const storagePath = `${req.userId}/${Date.now()}-${file.originalname}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw uploadError;

    const { data: fileRecord, error: dbError } = await supabase
      .from('uploaded_files')
      .insert({
        user_id: req.userId!,
        filename: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    res.status(201).json({ file: fileRecord });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/process', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;

    const { data: fileRecord, error: fileError } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.userId!)
      .single();

    if (fileError) throw fileError;

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('uploads')
      .download(fileRecord.storage_path);

    if (downloadError) throw downloadError;

    const text = await fileData.text();
    const chunks = chunkText(text);

    const chunkRecords = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      chunkRecords.push({
        file_id: fileId,
        chunk_text: chunks[i],
        chunk_index: i,
        embedding,
      });
    }

    if (chunkRecords.length > 0) {
      const { error: chunkError } = await supabase
        .from('file_chunks')
        .insert(chunkRecords);

      if (chunkError) throw chunkError;
    }

    const { error: updateError } = await supabase
      .from('uploaded_files')
      .update({ processed: true, chunks_count: chunks.length })
      .eq('id', fileId);

    if (updateError) throw updateError;

    res.json({ message: 'File processed', chunks: chunks.length });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const fileId = req.params.id;

    const { data: fileRecord, error: fileError } = await supabase
      .from('uploaded_files')
      .select('storage_path')
      .eq('id', fileId)
      .eq('user_id', req.userId!)
      .single();

    if (fileError) throw fileError;

    await supabase.from('file_chunks').delete().eq('file_id', fileId);
    await supabase.storage.from('uploads').remove([fileRecord.storage_path]);
    await supabase.from('uploaded_files').delete().eq('id', fileId);

    res.json({ message: 'File deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
