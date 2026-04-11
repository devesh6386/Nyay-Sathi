import requests
import traceback
try:
    r = requests.post("http://localhost:8000/register", json={"email":"test2@test.com", "password":"password", "full_name":"Test", "role":"citizen"})
    print(r.status_code)
    print(r.text)
except Exception as e:
    traceback.print_exc()
