from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import requests
import json
import re
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs, quote_plus

app = FastAPI()

# Store sessions by xsrf_token
sessions: Dict[str, dict] = {}

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    xsrf_token: str
    message: str

class RequestItem(BaseModel):
    id: str
    displayLabel: str
    isDeleted: bool

class RequestsResponse(BaseModel):
    success: bool
    requests: List[RequestItem]

class PersonResponse(BaseModel):
    success: bool
    id: Optional[str] = None
    name: Optional[str] = None

class ContractResponse(BaseModel):
    success: bool
    contract_id: Optional[str] = None
    contract_name: Optional[str] = None

class ContractItem(BaseModel):
    id: str
    displayLabel: str
    isDeleted: bool

class ContractsResponse(BaseModel):
    success: bool
    contracts: List[ContractItem]

class PersonGroupItem(BaseModel):
    id: str
    name: str
    isDeleted: bool

class PersonGroupsResponse(BaseModel):
    success: bool
    personGroups: List[PersonGroupItem]

class SendRequest(BaseModel):
    userId: str
    userName: str
    effortExplanation: str
    effortStartDate: int
    effortEndDate: int
    scheduled: bool
    createNew: bool
    # For createNew = False
    requestId: Optional[str] = None
    contractId: Optional[str] = None
    # For createNew = True
    personGroupId: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    # Weekly scheduler
    weekly: Optional[bool] = False
    weeklyPeriodEnd: Optional[int] = None  # End of the weekly period (timestamp ms)
    excludeWeeks: Optional[List[str]] = None  # List of date strings (YYYY-MM-DD) to skip

class SendResponse(BaseModel):
    success: bool
    message: str

def get_code(session: requests.Session):
    url = "https://destek.kafein.com.tr/saw/ess?TENANTID=797952178"

    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Host": "destek.kafein.com.tr",
        "Priority": "u=0, i",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0"
    }

    response = session.get(url, headers=headers)

    # Extract code token from final URL
    parsed_url = urlparse(response.url)
    query_params = parse_qs(parsed_url.query)
    code = query_params.get('code', [None])[0]
    return code, response.url

def login_firstpart(code, login_referer: str, session: requests.Session, username: str, password: str):
    post_url = f"https://destek.kafein.com.tr/idm-service/idm/v0/api/public/authenticate?code={code}"

    post_headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Content-Type": "application/json",
        "Host": "destek.kafein.com.tr",
        "Origin": "https://destek.kafein.com.tr",
        "Priority": "u=0",
        "Referer": login_referer,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0"
    }

    post_data = {
        "tenantName": "797952178",
        "passwordCredentials": {
            "username": username,
            "password": password,
            "passcode": ""
        }
    }

    post_response = session.post(post_url, headers=post_headers, json=post_data)

    # Parse JSON response and extract return_uri
    response_data = json.loads(post_response.text)
    return_uri = response_data.get("returnUri", {}).get("return_uri")
    return return_uri

def login_secondpart(return_uri: str, login_referer: str, session: requests.Session):
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Host": "destek.kafein.com.tr",
        "Priority": "u=0, i",
        "Referer": login_referer,
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0"
    }

    response = session.get(return_uri, headers=headers, allow_redirects=True)
    
    xsrf_token = None
    
    # Extract XSRF-TOKEN from the first response (redirect response) if there was a redirect
    if response.history:
        first_response = response.history[0]
        for key, value in first_response.headers.items():
            # Extract XSRF-TOKEN from Set-Cookie header
            if key.lower() == 'set-cookie':
                # Use regex to find XSRF-TOKEN=value pattern (value until semicolon or comma or end)
                match = re.search(r'XSRF-TOKEN=([^;,\s]+)', value)
                if match:
                    xsrf_token = match.group(1)
                    break
    
    return xsrf_token

def get_all_requests(session: requests.Session, xsrf_token: str):
    url = "https://destek.kafein.com.tr/rest/797952178/ems/Request?layout=Id,DisplayLabel,IsDeleted&meta=totalCount&order=DisplayLabel+asc&size=30000"
    
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Host": "destek.kafein.com.tr",
        "Referer": "https://destek.kafein.com.tr/saw/custom/RequestEffortTracker_c?TENANTID=797952178",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
        "X-Client-Tenant-Version": "v29",
        "X-REQUEST-LAND": "Unknown",
        "X-Requested-With": "XMLHttpRequest",
        "X-UI-Timestamp": str(int(time.time() * 1000)),
        "X-XSRF-TOKEN": xsrf_token
    }
    
    response = session.get(url, headers=headers)
    
    # Parse JSON response and extract Id, DisplayLabel, and IsDeleted
    response_data = json.loads(response.text)
    entities = response_data.get("entities", [])
    
    requests_list = []
    for entity in entities:
        properties = entity.get("properties", {})
        entity_id = properties.get("Id")
        display_label = properties.get("DisplayLabel")
        is_deleted = properties.get("IsDeleted", False)
        if entity_id and display_label:
            requests_list.append({
                "id": entity_id,
                "displayLabel": display_label,
                "isDeleted": is_deleted
            })
    
    return requests_list

def get_all_contracts(session: requests.Session, xsrf_token: str):
    url = "https://destek.kafein.com.tr/rest/797952178/ems/Contract?layout=Id,ContractNumber,Name,ContractType,DisplayLabel,StartDate,EndDate,Vendor,IsDeleted&meta=totalCount&order=DisplayLabel+asc&size=3000"
    
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Host": "destek.kafein.com.tr",
        "Referer": "https://destek.kafein.com.tr/saw/Requests?TENANTID=797952178",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
        "X-Client-Tenant-Version": "v29",
        "X-REQUEST-LAND": "Unknown",
        "X-Requested-With": "XMLHttpRequest",
        "X-UI-Timestamp": str(int(time.time() * 1000)),
        "X-XSRF-TOKEN": xsrf_token
    }
    
    response = session.get(url, headers=headers)
    
    # Parse JSON response and extract Id and DisplayLabel
    response_data = json.loads(response.text)
    entities = response_data.get("entities", [])
    
    contracts_list = []
    for entity in entities:
        properties = entity.get("properties", {})
        entity_id = properties.get("Id")
        display_label = properties.get("DisplayLabel")
        is_deleted = properties.get("IsDeleted", False)
        if entity_id and display_label:
            contracts_list.append({
                "id": entity_id,
                "displayLabel": display_label,
                "isDeleted": is_deleted
            })
    
    return contracts_list

def get_person_groups(session: requests.Session, xsrf_token: str):
    url = "https://destek.kafein.com.tr/rest/797952178/ems/PersonGroup?filter=(Status+%3D+%27Active%27+or+Status+%3D+null)&layout=Name,IsDeleted&meta=totalCount&order=Name+asc&size=3000"
    
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Host": "destek.kafein.com.tr",
        "Referer": "https://destek.kafein.com.tr/saw/Requests?TENANTID=797952178",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
        "X-Client-Tenant-Version": "v29",
        "X-REQUEST-LAND": "Unknown",
        "X-Requested-With": "XMLHttpRequest",
        "X-UI-Timestamp": str(int(time.time() * 1000)),
        "X-XSRF-TOKEN": xsrf_token
    }
    
    response = session.get(url, headers=headers)
    
    # Parse JSON response and extract Id and Name
    response_data = json.loads(response.text)
    entities = response_data.get("entities", [])
    
    person_groups_list = []
    for entity in entities:
        properties = entity.get("properties", {})
        entity_id = properties.get("Id")
        name = properties.get("Name")
        is_deleted = properties.get("IsDeleted", False)
        if entity_id and name:
            person_groups_list.append({
                "id": entity_id,
                "name": name,
                "isDeleted": is_deleted
            })
    
    return person_groups_list

def create_new_request(session: requests.Session, xsrf_token: str, contract_id: str, person_group_id: str, 
                       name: str, description: str, user_id: str):
    """
    Create a new Request using the bulk API endpoint.
    
    Args:
        session: requests.Session object with cookies
        xsrf_token: XSRF token for authentication
        contract_id: Contract ID
        person_group_id: Service Desk Group ID (Person Group ID)
        name: DisplayLabel for the request
        description: Description for the request
        user_id: RequestedByPerson ID
    
    Returns:
        Response object from the API call
    """
    # Generate current timestamp in milliseconds
    start_date = int(time.time() * 1000)
    url = "https://destek.kafein.com.tr/rest/797952178/ems/bulk"
    
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Content-Type": "application/json;charset=utf-8",
        "Host": "destek.kafein.com.tr",
        "Origin": "https://destek.kafein.com.tr",
        "Referer": "https://destek.kafein.com.tr/saw/Requests?TENANTID=797952178",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
        "X-Client-Tenant-Version": "v29",
        "X-REQUEST-LAND": "Unknown",
        "X-Requested-With": "XMLHttpRequest",
        "X-UI-Timestamp": str(int(time.time() * 1000)),
        "X-XSRF-TOKEN": xsrf_token
    }
    
    # Prepare request body
    request_body = {
        "entities": [
            {
                "entity_type": "Request",
                "properties": {
                    "StartDate": start_date,
                    "RequestedByPerson": user_id,
                    "ServiceDeskGroup": person_group_id,
                    "Contract_c": contract_id,
                    "RequestsOffering": "14640",  # Default value, may need to be configurable
                    "DisplayLabel": name,
                    "Description": f"<p>{description}</p>",
                    "UserOptions": "{\"complexTypeProperties\":[{\"properties\":{}}]}",
                    "DataDomains": ["Public"],
                    "DetectedEntities": "{\"complexTypeProperties\":[]}"
                }
            }
        ],
        "operation": "CREATE"
    }
    
    response = session.post(url, headers=headers, json=request_body)
    
    # Parse response to extract ID
    try:
        response_data = json.loads(response.text)
        
        # Check if response has the expected structure
        if "entity_result_list" in response_data and len(response_data["entity_result_list"]) > 0:
            entity_result = response_data["entity_result_list"][0]
            if entity_result.get("completion_status") == "OK" and "entity" in entity_result:
                entity = entity_result["entity"]
                if "properties" in entity and "Id" in entity["properties"]:
                    request_id = entity["properties"]["Id"]
                    return {
                        "success": True,
                        "request_id": request_id,
                        "response": response_data
                    }
        
        # If structure doesn't match expected format, it's a failure
        return {
            "success": False,
            "error": "Unexpected response structure",
            "response": response_data
        }
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Invalid JSON response",
            "response_text": response.text
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "response_text": response.text
        }

def create_effort(session: requests.Session, xsrf_token: str, request_id: str, contract_id: str,
                  effort_owner_id: str, effort_explanation: str, effort_start_date: int, effort_end_date: int):
    """
    Create a RequestEffortTracker_c entry using the bulk API endpoint.
    
    Args:
        session: requests.Session object with cookies
        xsrf_token: XSRF token for authentication
        request_id: Request ID (Request_c)
        contract_id: Contract ID (Contract_c)
        effort_owner_id: Effort Owner ID (EffortOwner_c)
        effort_explanation: Effort Explanation (EffortExplanation_c)
        effort_start_date: Effort Start Date timestamp in milliseconds (EffortStartDate_c)
        effort_end_date: Effort End Date timestamp in milliseconds (EffortEndDate_c)
    
    Returns:
        Dictionary with success status and response data
    """
    url = "https://destek.kafein.com.tr/rest/797952178/ems/bulk"
    
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Content-Type": "application/json;charset=utf-8",
        "Host": "destek.kafein.com.tr",
        "Origin": "https://destek.kafein.com.tr",
        "Referer": "https://destek.kafein.com.tr/saw/custom/RequestEffortTracker_c?TENANTID=797952178",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
        "X-Client-Tenant-Version": "v29",
        "X-REQUEST-LAND": "Unknown",
        "X-Requested-With": "XMLHttpRequest",
        "X-UI-Timestamp": str(int(time.time() * 1000)),
        "X-XSRF-TOKEN": xsrf_token
    }
    
    # Prepare request body
    request_body = {
        "entities": [
            {
                "entity_type": "RequestEffortTracker_c",
                "properties": {
                    "Request_c": request_id,
                    "Contract_c": contract_id,
                    "EffortOwner_c": effort_owner_id,
                    "EffortExplanation_c": effort_explanation,
                    "EffortStartDate_c": effort_start_date,
                    "EffortEndDate_c": effort_end_date
                }
            }
        ],
        "operation": "CREATE"
    }
    
    response = session.post(url, headers=headers, json=request_body)
    
    # Parse response to check success
    try:
        response_data = json.loads(response.text)
        
        # Check if response has the expected structure and completion_status is OK
        meta_status = response_data.get("meta", {}).get("completion_status")
        if meta_status == "OK" and "entity_result_list" in response_data and len(response_data["entity_result_list"]) > 0:
            entity_result = response_data["entity_result_list"][0]
            if entity_result.get("completion_status") == "OK":
                effort_id = None
                if "entity" in entity_result and "properties" in entity_result["entity"]:
                    effort_id = entity_result["entity"]["properties"].get("Id")
                
                return {
                    "success": True,
                    "effort_id": effort_id,
                    "response": response_data
                }
        
        # If structure doesn't match expected format or completion_status is not OK, it's a failure
        return {
            "success": False,
            "error": f"Unexpected response structure or completion_status not OK. Meta status: {meta_status}",
            "response": response_data
        }
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Invalid JSON response",
            "response_text": response.text
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "response_text": response.text
        }

def get_person(session: requests.Session, xsrf_token: str, username: str):
    url = "https://destek.kafein.com.tr/rest/797952178/ems/Person?filter=((IsSystemIntegration+!%3D+%27true%27+and+IsSystem+!%3D+%27true%27+or+IsSystemIntegration+%3D+null)+and+((EmployeeStatus+!%3D+%27Retired%27+and+EmployeeStatus+!%3D+%27Terminated%27)+or+EmployeeStatus+%3D+null))&layout=Name,Avatar,Location,IsVIP,OrganizationalGroup,Upn,IsDeleted,FirstName,LastName,EmployeeNumber,Email&meta=totalCount&order=Name+asc&size=3000"
    
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Host": "destek.kafein.com.tr",
        "Referer": "https://destek.kafein.com.tr/saw/custom/RequestEffortTracker_c?TENANTID=797952178",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
        "X-Client-Tenant-Version": "v29",
        "X-REQUEST-LAND": "Unknown",
        "X-Requested-With": "XMLHttpRequest",
        "X-UI-Timestamp": str(int(time.time() * 1000)),
        "X-XSRF-TOKEN": xsrf_token
    }
    
    response = session.get(url, headers=headers)
    
    # Parse JSON response and find entity where Upn matches username
    response_data = json.loads(response.text)
    entities = response_data.get("entities", [])
    
    for entity in entities:
        properties = entity.get("properties", {})
        upn = properties.get("Upn")
        if upn == username:
            name = properties.get("Name")
            person_id = properties.get("Id")
            return {"id": person_id, "name": name}
    
    return None

def get_contract(request_id: str, session: requests.Session, xsrf_token: str):
    url = "https://destek.kafein.com.tr/rest/797952178/workflow/simulator/RequestEffortTracker_c"
    
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Content-Type": "application/json;charset=utf-8",
        "Host": "destek.kafein.com.tr",
        "Origin": "https://destek.kafein.com.tr",
        "Priority": "u=0",
        "Referer": "https://destek.kafein.com.tr/saw/custom/RequestEffortTracker_c?TENANTID=797952178",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
        "X-Client-Tenant-Version": "v29",
        "X-REQUEST-LAND": "Unknown",
        "X-Requested-With": "XMLHttpRequest",
        "X-UI-Timestamp": str(int(time.time() * 1000)),
        "X-XSRF-TOKEN": xsrf_token
    }
    
    post_data = {
        "NewEntity": {
            "entity_type": "RequestEffortTracker_c",
            "properties": {
                "Request_c": request_id
            }
        }
    }
    
    response = session.post(url, headers=headers, json=post_data)
    
    # Parse JSON response and extract Contract_c
    response_data = json.loads(response.text)
    contract_c = response_data.get("ChangedFields", {}).get("Contract_c")
    
    if contract_c:
        # Second request: Get contract details using contract_c
        filter_value = f"Id = '{contract_c}'"
        encoded_filter = quote_plus(filter_value)
        contract_url = f"https://destek.kafein.com.tr/rest/797952178/ems/Contract?filter={encoded_filter}&layout=Id,ContractNumber,Name,ContractType,DisplayLabel,StartDate,EndDate,Vendor,IsDeleted&meta=totalCount"
        
        contract_headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
            "Host": "destek.kafein.com.tr",
            "Referer": "https://destek.kafein.com.tr/saw/custom/RequestEffortTracker_c?TENANTID=797952178",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
            "X-Client-Tenant-Version": "v29",
            "X-REQUEST-LAND": "Unknown",
            "X-Requested-With": "XMLHttpRequest",
            "X-UI-Timestamp": str(int(time.time() * 1000)),
            "X-XSRF-TOKEN": xsrf_token
        }
        
        contract_response = session.get(contract_url, headers=contract_headers)
        
        # Parse JSON response and extract DisplayLabel
        contract_response_data = json.loads(contract_response.text)
        entities = contract_response_data.get("entities", [])
        
        if entities:
            display_label = entities[0].get("properties", {}).get("DisplayLabel")
            return {"contract_id": contract_c, "contract_name": display_label}
    
    return None

@app.post("/api/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    try:
        username = login_request.username
        password = login_request.password
        
        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password are required")
        
        # Create a new session for this login
        session = requests.Session()
        
        # Perform login steps
        code, login_referer = get_code(session)
        if not code:
            raise HTTPException(status_code=500, detail="Failed to get code")
        
        return_uri = login_firstpart(code, login_referer, session, username, password)
        if not return_uri:
            raise HTTPException(status_code=401, detail="Login failed - invalid credentials")
        
        xsrf_token = login_secondpart(return_uri, login_referer, session)
        if not xsrf_token:
            raise HTTPException(status_code=500, detail="Failed to get XSRF token")
        
        # Store session and username for future requests
        sessions[xsrf_token] = {
            'session': session,
            'username': username
        }
        
        # Return success with token
        return LoginResponse(
            success=True,
            xsrf_token=xsrf_token,
            message="Login successful"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/requests", response_model=RequestsResponse)
async def get_requests(xsrf_token: str = Header(..., alias="X-XSRF-Token")):
    try:
        # Retrieve session using xsrf_token
        session_data = sessions.get(xsrf_token)
        if not session_data:
            raise HTTPException(status_code=401, detail="Session not found. Please login again.")
        
        session = session_data['session']
        
        # Get all requests using the stored session
        requests_list = get_all_requests(session, xsrf_token)
        
        # Convert to RequestItem models
        request_items = [
            RequestItem(
                id=req["id"],
                displayLabel=req["displayLabel"],
                isDeleted=req["isDeleted"]
            )
            for req in requests_list
        ]
        
        return RequestsResponse(
            success=True,
            requests=request_items
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/person", response_model=PersonResponse)
async def get_person_info(xsrf_token: str = Header(..., alias="X-XSRF-Token")):
    try:
        # Retrieve session using xsrf_token
        session_data = sessions.get(xsrf_token)
        if not session_data:
            raise HTTPException(status_code=401, detail="Session not found. Please login again.")
        
        session = session_data['session']
        username = session_data['username']
        
        # Get person info using the stored session
        person_info = get_person(session, xsrf_token, username)
        
        if not person_info:
            return PersonResponse(
                success=False,
                id=None,
                name=None
            )
        
        return PersonResponse(
            success=True,
            id=person_info.get("id"),
            name=person_info.get("name")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ContractRequest(BaseModel):
    request_id: str

@app.post("/api/contract", response_model=ContractResponse)
async def get_contract_info(contract_request: ContractRequest, xsrf_token: str = Header(..., alias="X-XSRF-Token")):
    try:
        # Retrieve session using xsrf_token
        session_data = sessions.get(xsrf_token)
        if not session_data:
            raise HTTPException(status_code=401, detail="Session not found. Please login again.")
        
        session = session_data['session']
        request_id = contract_request.request_id
        
        # Get contract info using the stored session
        contract_info = get_contract(request_id, session, xsrf_token)
        
        if not contract_info:
            return ContractResponse(
                success=False,
                contract_id=None,
                contract_name=None
            )
        
        return ContractResponse(
            success=True,
            contract_id=contract_info.get("contract_id"),
            contract_name=contract_info.get("contract_name")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contracts", response_model=ContractsResponse)
async def get_all_contracts_endpoint(xsrf_token: str = Header(..., alias="X-XSRF-Token")):
    try:
        # Retrieve session using xsrf_token
        session_data = sessions.get(xsrf_token)
        if not session_data:
            raise HTTPException(status_code=401, detail="Session not found. Please login again.")
        
        session = session_data['session']
        
        # Get all contracts using the stored session
        contracts_list = get_all_contracts(session, xsrf_token)
        
        return ContractsResponse(
            success=True,
            contracts=[ContractItem(**contract) for contract in contracts_list]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/person-groups", response_model=PersonGroupsResponse)
async def get_person_groups_endpoint(xsrf_token: str = Header(..., alias="X-XSRF-Token")):
    try:
        # Retrieve session using xsrf_token
        session_data = sessions.get(xsrf_token)
        if not session_data:
            raise HTTPException(status_code=401, detail="Session not found. Please login again.")
        
        session = session_data['session']
        
        # Get all person groups using the stored session
        person_groups_list = get_person_groups(session, xsrf_token)
        
        return PersonGroupsResponse(
            success=True,
            personGroups=[PersonGroupItem(**group) for group in person_groups_list]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_effort_trackers(session: requests.Session, xsrf_token: str, user_id: str):
    """
    Fetch RequestEffortTracker_c entities filtered by PhaseId = 'InUse_c' and EffortOwner_c = user_id
    Returns list of effort tracker IDs
    """
    # URL encode the filter parameter
    filter_param = quote_plus(f"(PhaseId = 'InUse_c' and EffortOwner_c = '{user_id}')")
    url = f"https://destek.kafein.com.tr/rest/797952178/ems/RequestEffortTracker_c?filter={filter_param}&layout=Id,DisplayLabel,PhaseId,LastUpdateTime&meta=totalCount&size=3000&skip=0"
    
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Host": "destek.kafein.com.tr",
        "Referer": "https://destek.kafein.com.tr/saw/custom/RequestEffortTracker_c?TENANTID=797952178",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0",
        "X-Client-Tenant-Version": "v29",
        "X-REQUEST-LAND": "Unknown",
        "X-Requested-With": "XMLHttpRequest",
        "X-UI-Timestamp": str(int(time.time() * 1000)),
        "X-XSRF-TOKEN": xsrf_token
    }
    
    response = session.get(url, headers=headers)
    response.raise_for_status()
    
    response_data = json.loads(response.text)
    entities = response_data.get("entities", [])
    
    # Extract IDs from entities
    effort_tracker_ids = []
    for entity in entities:
        properties = entity.get("properties", {})
        effort_id = properties.get("Id")
        if effort_id:
            effort_tracker_ids.append(effort_id)
    
    return effort_tracker_ids

def get_effort_tracker_details(session: requests.Session, xsrf_token: str, effort_tracker_id: str):
    """
    Fetch full details for a specific RequestEffortTracker_c entity by ID
    """
    url = f"https://destek.kafein.com.tr/rest/797952178/ems/RequestEffortTracker_c/{effort_tracker_id}?layout=FULL_LAYOUT,RELATION_LAYOUT.item"
    
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Host": "destek.kafein.com.tr",
        "Referer": "https://destek.kafein.com.tr/saw/custom/RequestEffortTracker_c?TENANTID=797952178",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0",
        "X-Client-Tenant-Version": "v29",
        "X-REQUEST-LAND": "Unknown",
        "X-Requested-With": "XMLHttpRequest",
        "X-UI-Timestamp": str(int(time.time() * 1000)),
        "X-XSRF-TOKEN": xsrf_token
    }
    
    response = session.get(url, headers=headers)
    response.raise_for_status()
    
    return json.loads(response.text)

@app.get("/api/effort-trackers")
async def get_effort_trackers_endpoint(xsrf_token: str = Header(..., alias="X-XSRF-Token")):
    """
    Get effort trackers for the logged-in user when calendar is opened
    """
    try:
        # Retrieve session using xsrf_token
        session_data = sessions.get(xsrf_token)
        if not session_data:
            raise HTTPException(status_code=401, detail="Session not found. Please login again.")
        
        session = session_data['session']
        username = session_data['username']
        
        # Get user ID from person info
        person_info = get_person(session, xsrf_token, username)
        if not person_info or not person_info.get("id"):
            raise HTTPException(status_code=404, detail="User ID not found")
        
        user_id = person_info["id"]
        
        # Fetch effort tracker IDs
        effort_tracker_ids = get_effort_trackers(session, xsrf_token, user_id)
        
        # Fetch full details for each effort tracker ID
        effort_trackers = []
        for effort_id in effort_tracker_ids:
            try:
                details_response = get_effort_tracker_details(session, xsrf_token, effort_id)
                
                # Validate response structure
                if not isinstance(details_response, dict):
                    print(f"Invalid response format for effort tracker {effort_id}")
                    continue
                
                entities = details_response.get("entities", [])
                if not entities or len(entities) == 0:
                    print(f"No entities found in response for effort tracker {effort_id}")
                    continue
                
                entity = entities[0]
                properties = entity.get("properties", {})
                related_properties = entity.get("related_properties", {})
                
                # Validate required fields
                if "EffortStartDate_c" not in properties or "EffortEndDate_c" not in properties:
                    print(f"Missing required date fields for effort tracker {effort_id}")
                    continue
                
                # Extract effort data
                effort_data = {
                    "id": properties.get("Id"),
                    "displayLabel": properties.get("DisplayLabel"),
                    "effortStartDate": properties.get("EffortStartDate_c"),
                    "effortEndDate": properties.get("EffortEndDate_c"),
                    "effortExplanation": properties.get("EffortExplanation_c", ""),
                    "totalEffortTime": properties.get("TotalEffortTime_c", ""),
                    "hours": properties.get("Hours_c", 0),
                    "minutes": properties.get("Minutes_c", 0),
                    "days": properties.get("Days_c", 0),
                    "contract": related_properties.get("Contract_c", {}).get("DisplayLabel", ""),
                    "request": related_properties.get("Request_c", {}).get("DisplayLabel", ""),
                }
                
                effort_trackers.append(effort_data)
                
            except Exception as e:
                print(f"Error fetching details for effort tracker {effort_id}: {str(e)}")
                # Continue with other IDs even if one fails
                continue
        
        return {
            "success": True,
            "effortTrackers": effort_trackers
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/send", response_model=SendResponse)
async def send_data(send_request: SendRequest, xsrf_token: str = Header(..., alias="X-XSRF-Token")):
    try:
        # Retrieve session using xsrf_token
        session_data = sessions.get(xsrf_token)
        if not session_data:
            raise HTTPException(status_code=401, detail="Session not found. Please login again.")
        
        session = session_data['session']
        
        # Print all received data
        print("\n" + "="*80)
        print("RECEIVED DATA:")
        print("="*80)
        print(f"User ID: {send_request.userId}")
        print(f"User Name: {send_request.userName}")
        print(f"Create New: {send_request.createNew}")
        print(f"Effort Explanation: {send_request.effortExplanation}")
        print(f"Effort Start Date: {send_request.effortStartDate}")
        print(f"Effort End Date: {send_request.effortEndDate}")
        print(f"Scheduled: {send_request.scheduled}")
        
        if send_request.createNew:
            print("\n--- Create New Flow Data ---")
            print(f"Contract ID: {send_request.contractId}")
            print(f"Person Group ID: {send_request.personGroupId}")
            print(f"Name: {send_request.name}")
            print(f"Description: {send_request.description}")
            
            # Create new request using bulk API
            if not send_request.contractId or not send_request.personGroupId or not send_request.name:
                raise HTTPException(status_code=400, detail="Missing required fields for creating new request")
            
            create_result = create_new_request(
                session=session,
                xsrf_token=xsrf_token,
                contract_id=send_request.contractId,
                person_group_id=send_request.personGroupId,
                name=send_request.name,
                description=send_request.description or "",
                user_id=send_request.userId
            )
            
            if create_result["success"]:
                print(f"\n✅ Request created successfully!")
                print(f"Request ID: {create_result['request_id']}")
                print(f"Full Response: {json.dumps(create_result['response'], indent=2)}")
                request_id_to_use = create_result['request_id']
            else:
                print(f"\n❌ Failed to create request")
                print(f"Error: {create_result.get('error', 'Unknown error')}")
                if 'response' in create_result:
                    print(f"Response: {json.dumps(create_result['response'], indent=2)}")
                elif 'response_text' in create_result:
                    print(f"Response Text: {create_result['response_text']}")
                raise HTTPException(status_code=500, detail=f"Failed to create request: {create_result.get('error', 'Unknown error')}")
        else:
            print("\n--- Normal Flow Data ---")
            print(f"Request ID: {send_request.requestId}")
            print(f"Contract ID: {send_request.contractId}")
            request_id_to_use = send_request.requestId
        
        # Create effort tracking entry (Second request for createNew, First request for normal flow)
        if not request_id_to_use or not send_request.contractId:
            raise HTTPException(status_code=400, detail="Missing request ID or contract ID for creating effort")
        
        if send_request.weekly:
            # Weekly: Create effort entries every 7 days within a period
            start_dt = datetime.fromtimestamp(send_request.effortStartDate / 1000)
            end_dt = datetime.fromtimestamp(send_request.effortEndDate / 1000)

            start_time = start_dt.time()
            end_time = end_dt.time()

            # First occurrence date
            first_date = start_dt.date()
            # Period end date
            if send_request.weeklyPeriodEnd:
                period_end = datetime.fromtimestamp(send_request.weeklyPeriodEnd / 1000).date()
            else:
                period_end = end_dt.date()

            exclude_dates = set(send_request.excludeWeeks or [])

            current_date = first_date
            effort_results = []
            effort_count = 0

            while current_date <= period_end:
                date_str = current_date.strftime('%Y-%m-%d')
                if date_str not in exclude_dates:
                    day_start_dt = datetime.combine(current_date, start_time)
                    day_end_dt = datetime.combine(current_date, end_time)

                    day_start_timestamp = int(day_start_dt.timestamp() * 1000)
                    day_end_timestamp = int(day_end_dt.timestamp() * 1000)

                    print(f"\n📅 Creating weekly effort for {date_str} ({start_time.strftime('%H:%M')} to {end_time.strftime('%H:%M')})")

                    effort_result = create_effort(
                        session=session,
                        xsrf_token=xsrf_token,
                        request_id=request_id_to_use,
                        contract_id=send_request.contractId,
                        effort_owner_id=send_request.userId,
                        effort_explanation=send_request.effortExplanation,
                        effort_start_date=day_start_timestamp,
                        effort_end_date=day_end_timestamp
                    )

                    effort_results.append(effort_result)

                    if effort_result["success"]:
                        effort_count += 1
                        if effort_result.get("effort_id"):
                            print(f"✅ Effort ID: {effort_result['effort_id']}")
                    else:
                        print(f"❌ Failed: {effort_result.get('error', 'Unknown error')}")
                else:
                    print(f"\n⏭️ Skipping excluded week: {date_str}")

                current_date += timedelta(days=7)

            print(f"\n📊 Weekly Effort Summary:")
            print(f"Total entries created: {effort_count}/{len(effort_results)}")

            if effort_count < len(effort_results):
                failed_results = [r for r in effort_results if not r["success"]]
                error_messages = [r.get("error", "Unknown error") for r in failed_results]
                raise HTTPException(status_code=500, detail=f"Failed to create some weekly effort entries: {', '.join(error_messages)}")
        elif send_request.scheduled:
            # Scheduled: Create multiple effort entries, one for each day
            # Extract time components from start and end dates
            start_dt = datetime.fromtimestamp(send_request.effortStartDate / 1000)
            end_dt = datetime.fromtimestamp(send_request.effortEndDate / 1000)
            
            # Extract time components (hours and minutes)
            start_time = start_dt.time()
            end_time = end_dt.time()
            
            # Get start date (without time) and end date (without time)
            start_date_only = start_dt.date()
            end_date_only = end_dt.date()
            
            # Generate list of dates from start_date to end_date (exclusive of end_date)
            current_date = start_date_only
            effort_results = []
            effort_count = 0
            
            while current_date < end_date_only:
                # Create datetime for this day with start time
                day_start_dt = datetime.combine(current_date, start_time)
                # Create datetime for this day with end time
                day_end_dt = datetime.combine(current_date, end_time)
                
                # Convert to timestamps (milliseconds)
                day_start_timestamp = int(day_start_dt.timestamp() * 1000)
                day_end_timestamp = int(day_end_dt.timestamp() * 1000)
                
                print(f"\n📅 Creating scheduled effort for {current_date.strftime('%Y-%m-%d')} ({start_time.strftime('%H:%M')} to {end_time.strftime('%H:%M')})")
                
                effort_result = create_effort(
                    session=session,
                    xsrf_token=xsrf_token,
                    request_id=request_id_to_use,
                    contract_id=send_request.contractId,
                    effort_owner_id=send_request.userId,
                    effort_explanation=send_request.effortExplanation,
                    effort_start_date=day_start_timestamp,
                    effort_end_date=day_end_timestamp
                )
                
                effort_results.append(effort_result)
                
                if effort_result["success"]:
                    effort_count += 1
                    if effort_result.get("effort_id"):
                        print(f"✅ Effort ID: {effort_result['effort_id']}")
                else:
                    print(f"❌ Failed: {effort_result.get('error', 'Unknown error')}")
                
                # Move to next day
                current_date += timedelta(days=1)
            
            # Summary
            print(f"\n📊 Scheduled Effort Summary:")
            print(f"Total entries created: {effort_count}/{len(effort_results)}")
            
            if effort_count < len(effort_results):
                failed_results = [r for r in effort_results if not r["success"]]
                error_messages = [r.get("error", "Unknown error") for r in failed_results]
                raise HTTPException(status_code=500, detail=f"Failed to create some effort entries: {', '.join(error_messages)}")
        else:
            # Normal: Create single effort entry
            effort_result = create_effort(
                session=session,
                xsrf_token=xsrf_token,
                request_id=request_id_to_use,
                contract_id=send_request.contractId,
                effort_owner_id=send_request.userId,
                effort_explanation=send_request.effortExplanation,
                effort_start_date=send_request.effortStartDate,
                effort_end_date=send_request.effortEndDate
            )
            
            if effort_result["success"]:
                print(f"\n✅ Effort tracking entry created successfully!")
                if effort_result.get("effort_id"):
                    print(f"Effort ID: {effort_result['effort_id']}")
                print(f"Full Response: {json.dumps(effort_result['response'], indent=2)}")
            else:
                print(f"\n❌ Failed to create effort tracking entry")
                print(f"Error: {effort_result.get('error', 'Unknown error')}")
                if 'response' in effort_result:
                    print(f"Response: {json.dumps(effort_result['response'], indent=2)}")
                elif 'response_text' in effort_result:
                    print(f"Response Text: {effort_result['response_text']}")
                raise HTTPException(status_code=500, detail=f"Failed to create effort: {effort_result.get('error', 'Unknown error')}")
        
        print("="*80 + "\n")
        
        return SendResponse(
            success=True,
            message="Data sent and processed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8082)
