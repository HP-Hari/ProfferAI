from prometheus_client import Counter, Histogram, generate_latest
from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter()

REQUEST_COUNT = Counter("request_count", "Total number of requests", ["endpoint", "method"])
REQUEST_LATENCY = Histogram("request_latency_seconds", "Request latency", ["endpoint", "method"])

@router.get("/metrics")
async def metrics():
    data = generate_latest()
    return PlainTextResponse(data.decode("utf-8"))
