# API Documentation

## Overview
This document provides comprehensive documentation for the Cloud People API endpoints.

## Authentication
Authentication is handled through Supabase authentication. All API requests must include a valid JWT token in the Authorization header.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-production-url/api`

## Endpoints

### Users

#### Get User Profile
- **GET** `/api/users/profile`
- **Description**: Retrieves the profile information for the authenticated user
- **Authentication**: Required
- **Response**: 
  ```json
  {
    "id": "string",
    "email": "string",
    "name": "string",
    "created_at": "timestamp"
  }
  ```

[Additional endpoints to be documented...]

## Error Handling
All endpoints follow a consistent error response format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## Rate Limiting
- Rate limit: 100 requests per minute
- Rate limit headers included in responses
