PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  eml_file_path TEXT NOT NULL,
  eml_file_hash TEXT NOT NULL UNIQUE,
  "from" TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  received_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'EINGEGANGEN',
  requires_manual_review INTEGER NOT NULL DEFAULT 0,
  classification_rechtsgebiet TEXT,
  classification_thema_tag TEXT,
  classification_urgency TEXT,
  classification_confidence TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_hash ON inquiries(eml_file_hash);

CREATE TABLE IF NOT EXISTS answered_inquiries (
  id TEXT PRIMARY KEY,
  seed_id TEXT NOT NULL UNIQUE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  thema_tag TEXT NOT NULL,
  rechtsgebiet TEXT NOT NULL DEFAULT 'Umsatzsteuer',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL REFERENCES inquiries(id),
  original_ai_text TEXT NOT NULL,
  current_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  grounding_references TEXT NOT NULL DEFAULT '[]',
  model_name TEXT NOT NULL,
  rejection_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drafts_inquiry_id ON drafts(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);

CREATE TABLE IF NOT EXISTS similarity_matches (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL REFERENCES inquiries(id),
  answered_inquiry_id TEXT NOT NULL REFERENCES answered_inquiries(id),
  score REAL NOT NULL,
  question_snippet TEXT NOT NULL,
  answer_snippet TEXT NOT NULL,
  rank INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_similarity_matches_inquiry_id ON similarity_matches(inquiry_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  inquiry_id TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  previous_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_inquiry_id ON audit_log(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
