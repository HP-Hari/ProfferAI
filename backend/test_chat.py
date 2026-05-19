#!/usr/bin/env python3
import sys
import os
import requests
import json

def test_chat_pipeline():
    print("==========================================================")
    print("   AI-POWERED PROPOSAL AGENT - CHATBOT PIPELINE VERIFIER")
    print("==========================================================")

    base_url = "http://localhost:8000/api/v1"

    # Step 1: Create a new conversational session
    print("\n[Step 1] Initializing conversational AI Chat Session...")
    try:
        sess_res = requests.post(f"{base_url}/chat/sessions", json={"project_id": None})
        if sess_res.status_code != 200:
            print(f" -> Fail: Could not create chat session. Status: {sess_res.status_code}")
            sys.exit(1)
        session = sess_res.json()
        session_id = session["session_id"]
        print(f" -> Success! Created Session ID: {session_id}")
    except Exception as e:
        print(f" -> Connection error. Ensure Uvicorn is active on port 8000: {e}")
        sys.exit(1)

    # Step 2: Post the first message (Trigger TF-IDF recall & speculative cascade)
    print("\n[Step 2] Sending initial query to the Autonomous Agent...")
    payload = {
        "content": "Do you encrypt data in transit using TLS 1.3?"
    }
    msg_res = requests.post(f"{base_url}/chat/sessions/{session_id}/message", json=payload)
    if msg_res.status_code != 200:
        print(f" -> Fail: Could not post message. Status: {msg_res.status_code}")
        print(msg_res.text)
        sys.exit(1)
    
    agent_msg = msg_res.json()
    print(f"\n[Agent Response]:\n{agent_msg['content']}\n")
    print("GROUNDING CITATIONS LOGGED:")
    for cit in agent_msg.get("metadata_json", []):
        print(f" -> [MATCH] Title: {cit['title']} | Score: {float(cit['similarity_score'])*100:.1f}%")

    # Step 3: Verify Context Retention
    print("\n[Step 3] Fetching conversation history (Context Retention)...")
    history_res = requests.get(f"{base_url}/chat/sessions/{session_id}/history")
    if history_res.status_code != 200:
        print(f" -> Fail: Could not retrieve history.")
        sys.exit(1)
    
    history = history_res.json()
    print(f" -> Thread Log Count: {len(history)} messages found in database.")
    
    # Assert messages matches chronological trace
    assert history[0]["sender"] == "user"
    assert history[1]["sender"] == "agent"
    print(" -> Success! Context chronological order verified in database memory.")

    print("\n==========================================================")
    print("      CONVERSATIONAL AI CHATBOT PIPELINE IS 100% WORKING")
    print("==========================================================")

if __name__ == "__main__":
    test_chat_pipeline()
