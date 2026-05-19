from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

# User Schemas
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str
    domain_expertise: List[str] = []

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    buyer_name: str
    opportunity_name: str
    deadline: datetime

class ProjectCreate(ProjectBase):
    owner_id: UUID

class ProjectResponse(ProjectBase):
    project_id: UUID
    status: str
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentBase(BaseModel):
    file_name: str
    file_type: str
    file_url: str
    document_role: str = "buyer_rfp"

class DocumentResponse(DocumentBase):
    document_id: UUID
    project_id: UUID
    parsed_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Content Library Item Schemas
class ContentLibraryItemBase(BaseModel):
    network: str = "belief"
    title: str
    question_text: Optional[str] = None
    answer_text: str
    category: str
    tags: List[str] = []
    source_document: Optional[str] = None
    is_approved: bool = True

class ContentLibraryItemCreate(ContentLibraryItemBase):
    owner_id: Optional[UUID] = None

class ContentLibraryItemResponse(ContentLibraryItemBase):
    content_id: UUID
    owner_id: Optional[UUID] = None
    last_reviewed: datetime
    version: int
    created_at: datetime

    class Config:
        from_attributes = True

# Question Schemas
class QuestionBase(BaseModel):
    section_name: Optional[str] = None
    raw_text: str
    normalized_text: str
    category: str
    response_type: str = "paragraph"
    priority: str = "medium"
    status: str = "unassigned"

class QuestionCreate(QuestionBase):
    project_id: UUID
    document_id: Optional[UUID] = None

class QuestionResponse(QuestionBase):
    question_id: UUID
    project_id: UUID
    document_id: Optional[UUID] = None
    assigned_to: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Draft Answer Schemas
class DraftAnswerBase(BaseModel):
    generated_answer: str
    confidence_score: float
    risk_flags: List[str] = []
    sources_used: List[UUID] = []
    cascade_escalated: bool = False
    cascade_reason: Optional[str] = None

class DraftAnswerCreate(DraftAnswerBase):
    question_id: UUID

class DraftAnswerResponse(DraftAnswerBase):
    draft_id: UUID
    question_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Question Review (SME Action Payload)
class QuestionReviewPayload(BaseModel):
    reviewer_id: UUID
    action: str = Field(..., pattern="^(approved|rejected|revised)$")
    revised_answer: Optional[str] = None
    comments: Optional[str] = None

# Project Composition Payload
class ProjectComposePayload(BaseModel):
    requested_format: str = Field("docx", pattern="^(docx|xlsx|pdf)$")
    apply_branding_template_id: Optional[str] = None
    generate_executive_summary: bool = True

# Chat Schemas
class ChatSessionCreate(BaseModel):
    project_id: Optional[UUID] = None

class ChatSessionResponse(BaseModel):
    session_id: UUID
    project_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    message_id: UUID
    session_id: UUID
    sender: str
    content: str
    metadata_json: List[dict] = []
    created_at: datetime

    class Config:
        from_attributes = True
