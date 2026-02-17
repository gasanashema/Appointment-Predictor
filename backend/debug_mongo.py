
import os
import pymongo
import certifi
from dotenv import load_dotenv
import ssl

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
print(f"Testing connection to: {mongo_uri.split('@')[-1] if mongo_uri else 'None'}")

if not mongo_uri:
    print("ERROR: MONGO_URI is not set.")
    exit(1)

try:
    print("Attempting connection with certifi...")
    client = pymongo.MongoClient(mongo_uri, tlsCAFile=certifi.where())
    client.admin.command('ping')
    print("SUCCESS: Connected with certifi!")
except Exception as e:
    print(f"FAILED with certifi: {e}")

    try:
        print("\nAttempting connection with tlsAllowInvalidCertificates=True...")
        client = pymongo.MongoClient(mongo_uri, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
        client.admin.command('ping')
        print("SUCCESS: Connected with invalid certs allowed!")
    except Exception as e2:
        print(f"FAILED with invalid certs: {e2}")
        
    try:
        print("\nAttempting connection without certifi (system default)...")
        client = pymongo.MongoClient(mongo_uri)
        client.admin.command('ping')
        print("SUCCESS: Connected with system default!")
    except Exception as e3:
        print(f"FAILED with system default: {e3}")
