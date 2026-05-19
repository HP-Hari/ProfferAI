from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .config import settings
from .models import Base
import logging
import sys

logger = logging.getLogger(__name__)

# SQLAlchemy Engine Configuration with automatic zero-dependency fallback to SQLite
db_url = settings.DATABASE_URL
connect_args = {}

# Check if we can import psycopg2 driver for postgresql
if db_url.startswith("postgresql"):
    try:
        import psycopg2
    except ImportError:
        logger.warning("psycopg2 package not detected. Automatically falling back to local SQLite database for testing.")
        db_url = "sqlite:///./proposal_agent_fallback.db"

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    logger.info("Initializing database schemas...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        # Dynamic fallback: If postgres is not running, we could use sqlite for mock run verification
        if "postgresql" in settings.DATABASE_URL:
            logger.info("Attempting fallback initialization to local SQLite database...")
            sqlite_url = "sqlite:///./proposal_agent_fallback.db"
            fallback_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
            global SessionLocal
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=fallback_engine)
            Base.metadata.create_all(bind=fallback_engine)
            logger.info("Fallback SQLite database initialized successfully.")
