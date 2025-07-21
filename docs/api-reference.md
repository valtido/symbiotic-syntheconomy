# API Reference

Welcome to the Symbiotic Syntheconomy API documentation. This guide provides detailed information about our API endpoints, authentication, rate limits, and integration examples.

## Overview

The Symbiotic Syntheconomy API allows developers to interact with our platform programmatically. You can manage resources, automate tasks, and build custom integrations.

## Base URL

All API requests should be made to:
```
https://api.syntheconomy.io/v1
```

## Authentication

The API uses Bearer Token authentication. Include your API key in the `Authorization` header of every request:
```
Authorization: Bearer YOUR_API_KEY
```

### Obtaining an API Key
1. Log in to your Syntheconomy dashboard.
2. Navigate to the "API Keys" section.
3. Generate a new API key and store it securely.

**Note**: Do not expose your API key in client-side code or public repositories.

## Rate Limits

- **Default Limit**: 100 requests per minute
- **Burst Limit**: 10 requests per second

When rate limits are exceeded, you will receive a `429 Too Many Requests` response. The response includes headers with information about the limit:
```
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 0
X-Rate-Limit-Reset: UNIX_TIMESTAMP
```

## OpenAPI/Swagger Specification

Our API follows the OpenAPI 3.0 specification. You can download the full specification or view it in Swagger UI:

- [Download OpenAPI Spec](https://api.syntheconomy.io/v1/openapi.json)
- [View in Swagger UI](https://api.syntheconomy.io/v1/swagger)

Below is a sample of the OpenAPI spec for reference:

```yaml
openapi: 3.0.0
info:
  title: Symbiotic Syntheconomy API
  version: 1.0.0
servers:
  - url: https://api.syntheconomy.io/v1
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
security:
  - bearerAuth: []
paths:
  /users/{userId}:
    get:
      summary: Get user details
      parameters:
        - in: path
          name: userId
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User details
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: string }
                  name: { type: string }
                  email: { type: string }
```

## Example Requests and Responses

### Get User Details
**Request**:
```bash
curl -X GET "https://api.syntheconomy.io/v1/users/12345" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Response** (200 OK):
```json
{
  "id": "12345",
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

**Error Response** (404 Not Found):
```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 12345 not found"
  }
}
```

## Integration Guides

### SDKs and Libraries
We provide SDKs for multiple languages to simplify integration. Below are installation and usage examples for each SDK.

#### JavaScript/TypeScript
**Installation**:
```bash
npm install syntheconomy-sdk
```

**Usage**:
```typescript
import { SyntheconomyClient } from 'syntheconomy-sdk';

const client = new SyntheconomyClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://api.syntheconomy.io/v1'
});

async function getUserDetails(userId: string) {
  try {
    const user = await client.users.get(userId);
    console.log('User Details:', user);
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}

getUserDetails('12345');
```

#### Python
**Installation**:
```bash
pip install syntheconomy
```

**Usage**:
```python
from syntheconomy import SyntheconomyClient

client = SyntheconomyClient(api_key='YOUR_API_KEY', base_url='https://api.syntheconomy.io/v1')

try:
    user = client.users.get('12345')
    print('User Details:', user)
except Exception as e:
    print('Error fetching user:', str(e))
```

#### Java
**Installation (Maven)**:
```xml
<dependency>
  <groupId>io.syntheconomy</groupId>
  <artifactId>syntheconomy-sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

**Usage**:
```java
import io.syntheconomy.SyntheconomyClient;

public class Main {
  public static void main(String[] args) {
    SyntheconomyClient client = new SyntheconomyClient("YOUR_API_KEY", "https://api.syntheconomy.io/v1");
    try {
      Object user = client.users().get("12345");
      System.out.println("User Details: " + user);
    } catch (Exception e) {
      System.err.println("Error fetching user: " + e.getMessage());
    }
  }
}
```

## Error Handling

All API responses include appropriate HTTP status codes. Common error codes include:
- `400 Bad Request`: Invalid request parameters or payload.
- `401 Unauthorized`: Invalid or missing API key.
- `403 Forbidden`: Insufficient permissions.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Server-side error.

Error responses follow a standard format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message"
  }
}
```

## Webhooks

The Symbiotic Syntheconomy API supports webhooks for real-time event notifications. Configure webhook endpoints in your dashboard to receive events such as user updates or transaction completions.

**Example Webhook Payload**:
```json
{
  "event": "user.updated",
  "data": {
    "id": "12345",
    "name": "John Doe",
    "updatedAt": "2023-10-01T12:00:00Z"
  },
  "timestamp": "2023-10-01T12:00:01Z"
}
```

## Support

If you encounter issues or have questions, contact our support team at **support@syntheconomy.io** or join our [Developer Community](https://community.syntheconomy.io).
