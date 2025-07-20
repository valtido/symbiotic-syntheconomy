# Service Management Dashboard

A dedicated dashboard for monitoring and controlling all services in the Symbiotic Syntheconomy project.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the dashboard
npm run dev
```

The dashboard will be available at: http://localhost:3007

## 📋 Features

- **Service Monitoring**: Real-time status checking for all project services
- **Service Control**: Start, stop, and restart services with a single click
- **Port Management**: Predefined port allocation to avoid conflicts
- **Health Checking**: Automatic health endpoint monitoring
- **Bulk Operations**: Start all services or refresh all statuses

## 🔧 Services Managed

| Service         | Port | Description                            |
| --------------- | ---- | -------------------------------------- |
| Backend API     | 3006 | Fastify backend with webhook endpoints |
| Frontend App    | 3000 | Next.js frontend application           |
| Smart Contracts | 3008 | Hardhat development environment        |
| File Watcher    | -    | Background process for auto-patching   |
| Patch Cleanup   | -    | Background process for cleanup         |

## 🎯 Usage

1. **Access Dashboard**: Navigate to http://localhost:3007
2. **Monitor Services**: View real-time status of all services
3. **Control Services**: Use the action buttons (▶️ Start, ⏹️ Stop, 🔄 Restart)
4. **Bulk Actions**: Use "Start All" or "Refresh All" buttons

## 🔌 API Endpoints

- `POST /api/management/service` - Control service actions
- `GET /api/management/service` - Get service status

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── api/management/service/route.ts  # Service control API
│   │   ├── management/page.tsx              # Main dashboard page
│   │   ├── layout.tsx                       # App layout
│   │   └── page.tsx                         # Redirect to management
│   └── components/                          # Empty (cleaned)
├── package.json
└── README.md
```

## 🔒 Port Allocation

- **Reserved**: 3000-3005, 4000 (off-limits)
- **Dashboard**: 3007
- **Backend**: 3006
- **Frontend**: 3000 (default)
- **Contracts**: 3008

## 🤝 Integration

This dashboard integrates with the main project's service management system and provides a clean, dedicated interface for service administration.
