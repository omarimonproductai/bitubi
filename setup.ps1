# Arrencada local de KOMOBI HD Fleet (Windows PowerShell)
# Requereix: Node.js 20+, i el Postgres corrent (docker compose up -d db).
$ErrorActionPreference = "Stop"

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host ".env creat des de .env.example" -ForegroundColor Green
}

Write-Host "Instal-lant dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Aplicant migracions..." -ForegroundColor Cyan
npx prisma migrate deploy
npx prisma generate

Write-Host "Carregant dades (seed + demo)..." -ForegroundColor Cyan
npm run db:seed
npm run db:demo

Write-Host ""
Write-Host "Llest! Arrenca amb:  npm run dev" -ForegroundColor Green
Write-Host "Obre:  http://localhost:3000/login  (backoffice)" -ForegroundColor Green
Write-Host "       http://localhost:3000/app/login  (app del rider)" -ForegroundColor Green
