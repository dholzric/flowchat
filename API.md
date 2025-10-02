# FlowChat API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Register

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null,
    "createdAt": "2025-10-02T10:00:00.000Z"
  }
}
```

### Login

**POST** `/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null
  }
}
```

### Get Current User

**GET** `/auth/me`

Get authenticated user's profile.

**Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null,
    "status": "ONLINE",
    "customStatus": "Working on FlowChat",
    "createdAt": "2025-10-02T10:00:00.000Z"
  }
}
```

### Update Profile

**PATCH** `/auth/me`

Update user profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "avatar": "https://example.com/avatar.jpg",
  "customStatus": "In a meeting"
}
```

## Workspaces

### Create Workspace

**POST** `/workspaces`

Create a new workspace.

**Request Body:**
```json
{
  "name": "My Team",
  "slug": "my-team",
  "description": "Our team workspace",
  "inviteOnly": false
}
```

**Response (201):**
```json
{
  "workspace": {
    "id": "clx...",
    "name": "My Team",
    "slug": "my-team",
    "description": "Our team workspace",
    "inviteOnly": false,
    "createdAt": "2025-10-02T10:00:00.000Z",
    "members": [...],
    "channels": [...]
  }
}
```

### List Workspaces

**GET** `/workspaces`

Get all workspaces for the authenticated user.

**Response (200):**
```json
{
  "workspaces": [
    {
      "id": "clx...",
      "name": "My Team",
      "slug": "my-team",
      "members": [...],
      "channels": [...]
    }
  ]
}
```

### Get Workspace

**GET** `/workspaces/:workspaceId`

Get detailed workspace information.

**Response (200):**
```json
{
  "workspace": {
    "id": "clx...",
    "name": "My Team",
    "slug": "my-team",
    "description": "Our team workspace",
    "members": [
      {
        "id": "clx...",
        "role": "OWNER",
        "user": {
          "id": "clx...",
          "username": "johndoe",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": null,
          "status": "ONLINE"
        }
      }
    ],
    "channels": [...]
  }
}
```

### Invite to Workspace

**POST** `/workspaces/:workspaceId/invite`

Invite a user to the workspace.

**Request Body:**
```json
{
  "userEmail": "newuser@example.com",
  "role": "MEMBER"
}
```

## Channels

### Create Channel

**POST** `/channels/workspace/:workspaceId`

Create a new channel in a workspace.

**Request Body:**
```json
{
  "name": "general",
  "description": "General discussion",
  "isPrivate": false
}
```

**Response (201):**
```json
{
  "channel": {
    "id": "clx...",
    "name": "general",
    "description": "General discussion",
    "isPrivate": false,
    "workspaceId": "clx...",
    "createdAt": "2025-10-02T10:00:00.000Z",
    "members": [...]
  }
}
```

### List Channels

**GET** `/channels/workspace/:workspaceId`

Get all channels in a workspace.

**Response (200):**
```json
{
  "channels": [
    {
      "id": "clx...",
      "name": "general",
      "description": "General discussion",
      "isPrivate": false,
      "members": [...],
      "_count": {
        "messages": 42
      }
    }
  ]
}
```

### Get Channel

**GET** `/channels/:channelId`

Get channel details.

**Response (200):**
```json
{
  "channel": {
    "id": "clx...",
    "name": "general",
    "description": "General discussion",
    "isPrivate": false,
    "workspace": {...},
    "members": [...]
  }
}
```

### Join Channel

**POST** `/channels/:channelId/join`

Join a public channel.

**Response (201):**
```json
{
  "member": {
    "id": "clx...",
    "role": "MEMBER",
    "user": {...}
  }
}
```

### Leave Channel

**DELETE** `/channels/:channelId/leave`

Leave a channel.

**Response (200):**
```json
{
  "message": "Left channel successfully"
}
```

## Messages

### Get Messages

**GET** `/messages/channel/:channelId?limit=50&before=2025-10-02T10:00:00.000Z`

Get messages from a channel.

**Query Parameters:**
- `limit` (optional): Number of messages to fetch (default: 50)
- `before` (optional): Get messages before this timestamp
- `after` (optional): Get messages after this timestamp

**Response (200):**
```json
{
  "messages": [
    {
      "id": "clx...",
      "content": "Hello, world!",
      "edited": false,
      "createdAt": "2025-10-02T10:00:00.000Z",
      "author": {
        "id": "clx...",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": null
      },
      "reactions": [],
      "replies": [],
      "_count": {
        "replies": 0
      }
    }
  ]
}
```

### Get Thread Replies

**GET** `/messages/:messageId/replies`

Get replies to a message.

**Response (200):**
```json
{
  "replies": [
    {
      "id": "clx...",
      "content": "Reply message",
      "author": {...},
      "reactions": []
    }
  ]
}
```

### Update Message

**PATCH** `/messages/:messageId`

Update a message (only your own).

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

### Delete Message

**DELETE** `/messages/:messageId`

Delete a message (only your own).

**Response (200):**
```json
{
  "message": "Message deleted successfully"
}
```

### Add Reaction

**POST** `/messages/:messageId/reactions`

Add an emoji reaction to a message.

**Request Body:**
```json
{
  "emoji": "👍"
}
```

**Response (201):**
```json
{
  "reaction": {
    "id": "clx...",
    "emoji": "👍",
    "user": {
      "id": "clx...",
      "username": "johndoe"
    }
  }
}
```

### Remove Reaction

**DELETE** `/messages/:messageId/reactions`

Remove a reaction from a message.

**Request Body:**
```json
{
  "emoji": "👍"
}
```

### Search Messages

**GET** `/messages/workspace/:workspaceId/search?query=hello&limit=50`

Search messages in a workspace.

**Query Parameters:**
- `query` (required): Search term
- `limit` (optional): Number of results (default: 50)

**Response (200):**
```json
{
  "messages": [
    {
      "id": "clx...",
      "content": "Hello, world!",
      "author": {...},
      "channel": {
        "id": "clx...",
        "name": "general",
        "workspaceId": "clx..."
      }
    }
  ]
}
```

## Direct Messages

### Get Conversations

**GET** `/dm`

Get all DM conversations for the user.

**Response (200):**
```json
{
  "conversations": [
    {
      "id": "clx...",
      "isGroup": false,
      "name": null,
      "participants": [...],
      "messages": [...],
      "_count": {
        "messages": 10
      }
    }
  ]
}
```

### Create Conversation

**POST** `/dm`

Create a new DM conversation.

**Request Body:**
```json
{
  "participantIds": ["clx..."],
  "isGroup": false,
  "name": "Group name" // optional, for groups
}
```

### Get DM Messages

**GET** `/dm/:conversationId/messages?limit=50`

Get messages from a DM conversation.

## File Upload

### Upload File

**POST** `/upload`

Upload a single file.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`

**Response (201):**
```json
{
  "file": {
    "filename": "1696248000000-123456789.jpg",
    "originalName": "photo.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "url": "/uploads/1696248000000-123456789.jpg"
  }
}
```

### Upload Multiple Files

**POST** `/upload/multiple`

Upload multiple files (max 10).

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `files`

**Response (201):**
```json
{
  "files": [
    {
      "filename": "1696248000000-123456789.jpg",
      "originalName": "photo1.jpg",
      "mimetype": "image/jpeg",
      "size": 1024000,
      "url": "/uploads/1696248000000-123456789.jpg"
    }
  ]
}
```

## WebSocket Events

Connect to WebSocket at `http://localhost:3000` with authentication:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events to Emit

#### Send Message
```javascript
socket.emit('message:send', {
  channelId: 'clx...',
  content: 'Hello!',
  parentId: 'clx...' // optional, for replies
});
```

#### Update Message
```javascript
socket.emit('message:update', {
  messageId: 'clx...',
  content: 'Updated content'
});
```

#### Delete Message
```javascript
socket.emit('message:delete', {
  messageId: 'clx...'
});
```

#### Add Reaction
```javascript
socket.emit('reaction:add', {
  messageId: 'clx...',
  emoji: '👍'
});
```

#### Typing Indicators
```javascript
socket.emit('typing:start', { channelId: 'clx...' });
socket.emit('typing:stop', { channelId: 'clx...' });
```

### Events to Listen

#### New Message
```javascript
socket.on('message:new', (message) => {
  console.log('New message:', message);
});
```

#### Message Updated
```javascript
socket.on('message:updated', (message) => {
  console.log('Message updated:', message);
});
```

#### User Status
```javascript
socket.on('user:status', ({ userId, status }) => {
  console.log(`User ${userId} is now ${status}`);
});
```

#### Typing
```javascript
socket.on('typing:user', ({ userId, channelId, typing }) => {
  console.log(`User ${userId} is ${typing ? 'typing' : 'not typing'}`);
});
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- 400: Bad Request (validation error)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (no permission)
- 404: Not Found
- 500: Internal Server Error

---

For more information, see SETUP.md
