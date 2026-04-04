# Finsight Backend - API Contract

**Base URL:** `/api/v1`

---

## 1. Health
### Health Check
- **Endpoint:** `/health`
- **Method:** `GET`
- **Description:** Verifies if the backend server is up and running.
- **Where it is used:** Infrastructure monitoring, liveliness probes, and initial connectivity checks.
- **Access Level:** Public
- **Response:**
  ```json
  { "status": "OK" }
  ```

---

## 2. Authentication
### 2.1 Register User
- **Endpoint:** `/auth/register`
- **Method:** `POST`
- **Description:** Registers a new user with an email, password, and specific role within a tenant.
- **Where it is used:** User onboarding, creating initial Admin users, or provisioning new analysts/viewers.
- **Access Level:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "tenantId": "string",
    "role": "ADMIN" // ADMIN, ANALYST, VIEWER
  }
  ```

### 2.2 Login User
- **Endpoint:** `/auth/login`
- **Method:** `POST`
- **Description:** Authenticates a user and returns a JSON Web Token (JWT) combining their context (tenantId, userId, role).
- **Where it is used:** Login page, establishing a session for API clients and web dashboards.
- **Access Level:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

---

## 3. Event Tracking
*All event tracking routes require a valid JWT (Protected).*

### 3.1 Track Single Event
- **Endpoint:** `/events`
- **Method:** `POST`
- **Description:** Records a telemetry event performed by a user on a specific feature.
- **Where it is used:** Frontend application interceptors, button clicks, page views, and API calls (logged via middleware).
- **Access Level:** Any Authenticated User
- **Request Body:**
  ```json
  {
    "sessionId": "string",
    "channel": "WEB", // WEB, MOBILE, API, BATCH
    "feature": "FEATURE_CODE",
    "eventType": "CLICK",
    "metadata": {},
    "timestamp": "2024-03-31T00:00:00Z"
  }
  ```

### 3.2 Get Events
- **Endpoint:** `/events`
- **Method:** `GET`
- **Description:** Retrieves paginated telemtry events for the tenant, with optional date and feature filters.
- **Where it is used:** Analyst data inspection, raw event logs viewer, debugging tracking issues.
- **Access Level:** Any Authenticated User
- **Query Parameters:** `page`, `limit`, `feature`, `channel`, `startDate`, `endDate`

### 3.3 Track Batch Events
- **Endpoint:** `/events/batch`
- **Method:** `POST`
- **Description:** Receives an array of events and logs them in bulk for the given tenant/user.
- **Where it is used:** Offline syncs, periodic batch uploads from mobile apps, or bulk migration scripts.
- **Access Level:** Any Authenticated User
- **Request Body:**
  ```json
  {
    "events": [
       { "feature": "FEATURE_X", "channel": "WEB" },
       { "feature": "FEATURE_Y", "channel": "WEB" }
    ]
  }
  ```

---

## 4. Analytics
*All analytics routes require a valid JWT and an elevated role (`ADMIN` or `ANALYST`).*

### 4.1 Feature Usage Analytics
- **Endpoint:** `/analytics/feature-usage`
- **Method:** `GET`
- **Description:** Returns an aggregation pipeline on how frequently each feature is used, broken down by channel and unique users.
- **Where it is used:** Analytics dashboard (e.g., bar charts or pie charts of top features).
- **Access Level:** ADMIN, ANALYST
- **Query Parameters:** `startDate`, `endDate`

### 4.2 Funnel Analytics
- **Endpoint:** `/analytics/funnel`
- **Method:** `GET`
- **Description:** Computes the funnel drop-off by retrieving ordered journey steps and overlaying unique user engagement for each step.
- **Where it is used:** Journey builder dashboards to understand where users drop off in a specific workflow (e.g. Onboarding).
- **Access Level:** ADMIN, ANALYST
- **Query Parameters:** `journeyId` (Required)

### 4.3 Dashboard Summary
- **Endpoint:** `/analytics/dashboard`
- **Method:** `GET`
- **Description:** Returns a quick high-level summary including total events, active users, and top 5 features.
- **Where it is used:** The main landing page of the admin/analytics portal for an at-a-glance KPI view.
- **Access Level:** ADMIN, ANALYST

---

## 5. Feature Management
*Protected routes for provisioning the features to track.*

### 5.1 Create Feature
- **Endpoint:** `/features`
- **Method:** `POST`
- **Description:** Registers a new feature code into the system documentation dictionary.
- **Where it is used:** Admin config portal when new modules are delivered in the product.
- **Access Level:** ADMIN only
- **Request Body:**
  ```json
  {
    "name": "Login Button",
    "code": "AUTH_LOGIN",
    "module": "Authentication",
    "description": "User clicks on the login button"
  }
  ```

### 5.2 Get Features
- **Endpoint:** `/features`
- **Method:** `GET`
- **Description:** Retrieves a list of active documented features in the system.
- **Where it is used:** Dropdowns when configuring journeys, filtering analytics dashboards.
- **Access Level:** ADMIN, ANALYST, VIEWER

---

## 6. Journey Management
*Protected routes for constructing expected funnels.*

### 6.1 Create Journey
- **Endpoint:** `/journeys`
- **Method:** `POST`
- **Description:** Instantiates a new logical Journey (e.g., "Registration Flow").
- **Where it is used:** Admin settings for defining tracked paths for analytics.
- **Access Level:** ADMIN only
- **Request Body:**
  ```json
  {
    "name": "Registration Flow"
  }
  ```

### 6.2 Add Journey Step
- **Endpoint:** `/journeys/step`
- **Method:** `POST`
- **Description:** Appends a specific Feature as a step in the ordered sequence of a Journey.
- **Where it is used:** Dashboard journey builder interfaces to link steps together.
- **Access Level:** ADMIN only
- **Request Body:**
  ```json
  {
    "journeyId": "ObjectId",
    "stepOrder": 1,
    "stepName": "Initial Click",
    "featureCode": "AUTH_LOGIN"
  }
  ```

### 6.3 Get Journey Steps
- **Endpoint:** `/journeys/:journeyId/steps`
- **Method:** `GET`
- **Description:** Retrieves all steps for a specific journey in ordered sequence.
- **Where it is used:** Inspecting defined funnels and generating the Funnel Analytics report.
- **Access Level:** ADMIN, ANALYST, VIEWER

---

## 7. Tenant Consent
*Protected routes affecting telemetry globally per tenant.*

### 7.1 Set Global Consent
- **Endpoint:** `/consent`
- **Method:** `POST`
- **Description:** Configures whether telemetry/tracking is enabled or severely blocked for the current tenant.
- **Where it is used:** Privacy/Data controls in the Admin settings UI.
- **Access Level:** ADMIN only
- **Request Body:**
  ```json
  {
    "telemetryEnabled": true
  }
  ```

### 7.2 Get Consent Status
- **Endpoint:** `/consent`
- **Method:** `GET`
- **Description:** Reads the tenant-wide tracking capability toggle.
- **Where it is used:** Frontend application bootstrap to determine if trackers should even load/send events.
- **Access Level:** ADMIN, ANALYST, VIEWER

---

## 8. Audit Logging
*Protected read-only access to mutation logs.*

### 8.1 Get Audit Logs
- **Endpoint:** `/audit`
- **Method:** `GET`
- **Description:** Retrieves chronological trail of systemic mutations (create journey, set consent, etc) per tenant.
- **Where it is used:** Compliance and security monitoring screens.
- **Access Level:** Any Authenticated User (Or potentially limited, currently protected by default)
