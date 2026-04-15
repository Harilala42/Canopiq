import os
import ee
from google.oauth2 import service_account

json_key: str = os.environ.get("SERVICE_ACCOUNT_FILE")

credentials = service_account.Credentials \
    .from_service_account_file(json_key)

# Anthentication to GEE using Service Account
try:
    ee.Initialize(
        credentials=credentials,
        project=os.environ.get("PROJECT_NAME")
    )

    print("Successfully connected to GEE")
except Exception as err:
    print("GEE Initialization failed: {err}")

