import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Explicitly load .env file variables into environment
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

class Settings(BaseSettings):
    PROJECT_NAME: str = "Proposal & RFP AI Agent"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./proposal_agent_fallback.db")
    
    # API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Model Configurations
    GROQ_CHEAP_MODEL: str = "qwen/qwen3-32b"  # Cost-efficient drafting model
    GROQ_PRO_MODEL: str = "openai/gpt-oss-120b"   # Flagship escalation reasoning model
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    class Config:
        case_sensitive = True

settings = Settings()
