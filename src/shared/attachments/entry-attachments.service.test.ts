import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteEntryAttachmentRecord,
  findEntryAttachmentById,
  findEntryAttachments,
  insertEntryAttachmentRecord,
  removeEntryAttachmentFile,
  uploadEntryAttachmentFile,
} from './entry-attachments.repository'
import {
  deleteEntryAttachment,
  listEntryAttachments,
  uploadEntryAttachment,
} from './entry-attachments.service'

vi.mock('./entry-attachments.repository', () => ({
  createEntryAttachmentSignedUrl: vi.fn(),
  deleteEntryAttachmentRecord: vi.fn(),
  findEntryAttachmentById: vi.fn(),
  findEntryAttachments: vi.fn(),
  insertEntryAttachmentRecord: vi.fn(),
  removeEntryAttachmentFile: vi.fn(),
  uploadEntryAttachmentFile: vi.fn(),
}))

const record = {
  id: 'attachment-1',
  entry_id: 'entry-1',
  storage_path: 'entries/entry-1/file.pdf',
  file_name: 'invoice.pdf',
  mime_type: 'application/pdf',
  size_bytes: 1024,
  sort_order: 0,
  created_by: 'user-1',
  created_at: '2026-08-11T10:00:00Z',
}

describe('entry attachments service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps repository records into the domain model', async () => {
    vi.mocked(findEntryAttachments).mockResolvedValue([record])

    await expect(listEntryAttachments('entry-1')).resolves.toEqual([
      {
        id: 'attachment-1',
        entryId: 'entry-1',
        storagePath: 'entries/entry-1/file.pdf',
        fileName: 'invoice.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        sortOrder: 0,
        createdBy: 'user-1',
        createdAt: '2026-08-11T10:00:00Z',
      },
    ])
  })

  it('rejects unsupported files before touching storage', async () => {
    const file = new File(['bad'], 'bad.exe', { type: 'application/octet-stream' })

    await expect(uploadEntryAttachment('entry-1', file)).rejects.toThrow('نوع الملف غير مسموح به')
    expect(uploadEntryAttachmentFile).not.toHaveBeenCalled()
  })

  it('removes the uploaded storage object when the DB insert fails', async () => {
    const file = new File(['pdf'], 'invoice.pdf', { type: 'application/pdf' })
    vi.mocked(uploadEntryAttachmentFile).mockResolvedValue(undefined)
    vi.mocked(insertEntryAttachmentRecord).mockRejectedValue(new Error('db failure'))
    vi.mocked(removeEntryAttachmentFile).mockResolvedValue(undefined)

    await expect(uploadEntryAttachment('entry-1', file)).rejects.toThrow('db failure')
    expect(removeEntryAttachmentFile).toHaveBeenCalledTimes(1)
  })

  it('returns a cleanup warning if storage deletion fails after the DB record is deleted', async () => {
    vi.mocked(findEntryAttachmentById).mockResolvedValue(record)
    vi.mocked(deleteEntryAttachmentRecord).mockResolvedValue(undefined)
    vi.mocked(removeEntryAttachmentFile).mockRejectedValue(new Error('storage failure'))

    await expect(deleteEntryAttachment('attachment-1')).resolves.toEqual({
      kind: 'cleanup_warning',
      attachmentId: 'attachment-1',
      storagePath: 'entries/entry-1/file.pdf',
      reason: 'storage failure',
    })
  })
})
