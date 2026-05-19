import datetime
import json
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Numeric, Text, ForeignKey, Table, Enum
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.types import TypeDecorator, TEXT
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

class JSONEncodedList(TypeDecorator):
    """
    Represents a list of items stored as a JSON string in SQLite / TEXT fields.
    Guarantees cross-database compatibility without native PG_ARRAY dependencies.
    """
    impl = TEXT

    def process_bind_param(self, value, dialect):
        if value is not None:
            # Safely serialize UUIDs or other objects to standard strings
            serializable_value = [str(item) if isinstance(item, uuid.UUID) else item for item in value]
            return json.dumps(serializable_value)
        return json.dumps([])

    def process_result_value(self, value, dialect):
        if value is not None:
            try:
                return json.loads(value)
            except Exception:
                return []
        return []

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="sme_reviewer") # admin, proposal_manager, sales_rep, sme_reviewer, legal_reviewer, executive
    domain_expertise = Column(JSONEncodedList, default=[])
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    projects = relationship("Project", back_populates="owner")
    questions = relationship("Question", back_populates="assignee")

class Project(Base):
    __tablename__ = "projects"
    
    project_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_name = Column(String(255), nullable=False)
    opportunity_name = Column(String(255), nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), nullable=False, default="intake") # intake, parsing, drafting, reviewing, composed, exported, archived
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    documents = relationship("UploadedDocument", back_populates="project", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="project", cascade="all, delete-orphan")

class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"
    
    document_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, docx, xlsx, txt
    file_url = Column(String(512), nullable=False) # local path or S3 url
    parsed_text = Column(Text, nullable=True)
    document_role = Column(String(100), default="buyer_rfp") # buyer_rfp, supporting_evidence
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="documents")
    questions = relationship("Question", back_populates="document")

class ContentLibraryItem(Base):
    __tablename__ = "content_library_items"
    
    content_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    network = Column(String(50), nullable=False, default="belief") # world, experience, belief, entity
    title = Column(String(255), nullable=False)
    question_text = Column(Text, nullable=True)
    answer_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=False) # security, compliance, legal, pricing, etc.
    tags = Column(JSONEncodedList, default=[])
    source_document = Column(String(255), nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    last_reviewed = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    is_approved = Column(Boolean, nullable=False, default=True)
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    embeddings = relationship("ContentEmbedding", back_populates="content_item", cascade="all, delete-orphan")

class ContentEmbedding(Base):
    __tablename__ = "content_embeddings"
    
    embedding_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_id = Column(UUID(as_uuid=True), ForeignKey("content_library_items.content_id", ondelete="CASCADE"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding_text = Column(Text, nullable=False) # comma-separated float representation for portability

    content_item = relationship("ContentLibraryItem", back_populates="embeddings")

class Question(Base):
    __tablename__ = "questions"
    
    question_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_documents.document_id", ondelete="SET NULL"), nullable=True)
    section_name = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=False)
    normalized_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=False) # security, legal, pricing, etc.
    response_type = Column(String(50), default="paragraph") # binary_yes_no, short_answer, paragraph
    priority = Column(String(20), default="medium") # low, medium, high
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), nullable=False, default="unassigned") # unassigned, auto_drafted, pending_sme, approved, rejected, revised
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="questions")
    document = relationship("UploadedDocument", back_populates="questions")
    assignee = relationship("User", back_populates="questions")
    retrieved_evidences = relationship("RetrievedEvidence", back_populates="question", cascade="all, delete-orphan")
    draft_answers = relationship("DraftAnswer", back_populates="question", cascade="all, delete-orphan")
    review_tasks = relationship("ReviewTask", back_populates="question", cascade="all, delete-orphan")

class RetrievedEvidence(Base):
    __tablename__ = "retrieved_evidence"
    
    retrieval_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.question_id", ondelete="CASCADE"), nullable=False)
    content_id = Column(UUID(as_uuid=True), ForeignKey("content_library_items.content_id", ondelete="CASCADE"), nullable=False)
    similarity_score = Column(Numeric(5, 4), nullable=False)
    citation_text = Column(Text, nullable=True)
    retrieved_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    question = relationship("Question", back_populates="retrieved_evidences")
    content_item = relationship("ContentLibraryItem")

class DraftAnswer(Base):
    __tablename__ = "draft_answers"
    
    draft_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.question_id", ondelete="CASCADE"), nullable=False)
    generated_answer = Column(Text, nullable=False)
    confidence_score = Column(Numeric(5, 4), nullable=False)
    risk_flags = Column(JSONEncodedList, default=[]) # no_source, outdated_source, unsupported_claim, sla_mismatch, legal_review_required
    sources_used = Column(JSONEncodedList, default=[]) # content_id array
    cascade_escalated = Column(Boolean, nullable=False, default=False)
    cascade_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    question = relationship("Question", back_populates="draft_answers")

class ReviewTask(Base):
    __tablename__ = "review_tasks"
    
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.question_id", ondelete="CASCADE"), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    comments = Column(Text, nullable=True)
    final_decision = Column(String(50), nullable=False, default="pending") # pending, approved, rejected, revised
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    question = relationship("Question", back_populates="review_tasks")
    assignee = relationship("User")

class ExportPackage(Base):
    __tablename__ = "export_packages"
    
    export_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    format = Column(String(50), nullable=False) # docx, xlsx, pdf
    version = Column(Integer, nullable=False, default=1)
    file_url = Column(String(512), nullable=False)
    generated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)

    project = relationship("Project")
    generator = relationship("User")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.session_id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(20), nullable=False) # user, agent
    content = Column(Text, nullable=False)
    metadata_json = Column(JSONEncodedList, default=[]) # stores citations, references, or raw metrics
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")
