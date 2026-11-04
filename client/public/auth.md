# /auth.md
# Authentication for Agents

Use OAuth 2.0 authorization code with PKCE for user-delegated access, or Bearer token for machine-to-machine agents. Request the minimum scopes needed for the task.

## Supported Discovery Endpoints
- **OAuth 2.0 Authorization Server**: `https://www.smartnshine.in/.well-known/oauth-authorization-server`
- **OpenID Connect**: `https://www.smartnshine.in/.well-known/openid-configuration`
- **OAuth Protected Resource**: `https://www.smartnshine.in/.well-known/oauth-protected-resource`

## Scopes
- `openid`: Standard identity verification
- `profile`: Read user profile details
- `email`: Read user email address
- `read:templates`: Access all 12+ ATS resume templates (public)
- `read:score`: Run ATS score calculations and job description keyword matching
- `write:resume`: Create, edit, and export resumes

## Token Handling
Include your Bearer token in standard HTTP headers:
```http
Authorization: Bearer <your_access_token>
```

## Rate Limits
- Public endpoints: 60 requests / minute
- Authenticated endpoints: 600 requests / minute
- Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Support
For API keys, agent integration queries, or enterprise access, contact `contact@smartnshine.in`.
