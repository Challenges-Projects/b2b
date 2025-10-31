# B2B Challenge (Node.js + TypeScript + MySQL + Docker + Serverless)

## Requisitos
- Docker Desktop
- Node.js **v22**
- npm

 
## Renombrar los .env.example ➡️ .env en los siguientes directorios
```
./packages/customers-api/
./packages/orders-api/
./packages/lambda-orchestrator/.env
```

## Levantar el entorno
```bash
docker compose up --build
# Customers: http://localhost:3001
# Orders:    http://localhost:3002
```

## Lambda local (Serverless Offline)
```bash
cd packages/lambda-orchestrator
npm install
npm run dev
# POST http://localhost:3000/orchestrator/create-and-confirm-order
```

## Para Documentacion, pruebas y ejemplos curl en OpenAPI
```
# Customers: http://localhost:3001/docs
# Orders:    http://localhost:3002/docs
```
