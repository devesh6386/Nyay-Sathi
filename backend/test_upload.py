import requests
import os

# Create a test file
with open("test.txt", "w") as f:
    f.write("test evidence")

# Get a complaint ID
import sqlite3
conn = sqlite3.connect("nyaysathi.db")
c = conn.cursor()
c.execute("SELECT id FROM complaints LIMIT 1")
complaint_id = c.fetchone()[0]
conn.close()

# Token (I'll need a real one or skip auth in main.py for test)
# For this test, I'll temporarily disable auth in main.py or use a mock user.
# Actually, I'll just check if the endpoint exists and accepts the params.

url = f"http://localhost:8000/complaints/{complaint_id}/evidence"
files = {'file': open('test.txt', 'rb')}
data = {'file_hash': 'testhash123'}
# No auth header for now - will fail with 401 if auth is working
r = requests.post(url, files=files, data=data)
print(f"Status: {r.status_code}")
print(f"Response: {r.text}")
