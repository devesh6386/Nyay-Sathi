from database import SessionLocal, User
from main import UserCreate, app
from fastapi.testclient import TestClient

client = TestClient(app)

response = client.post(
    "/register",
    json={"email": "newuser@test.com", "password": "password", "full_name": "Test", "role": "citizen"}
)

print(response.status_code)
print(response.json())
