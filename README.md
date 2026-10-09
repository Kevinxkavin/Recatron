# ⬡ RECATRON — Recon Intelligence Toolbox

MERN Stack cybersecurity recon dashboard 

## Stack
- **Frontend**: React + Vite (`localhost:5173`)
- **Backend**: Express + Node.js (`localhost:5000`)
- **Database**: MongoDB (optional — scans work without it)

## Quick Start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and API keys

# 3. Run both servers
npm run dev
```

## Dork Categories (20 total — from DorkHub)
| Category        | Description                            |
|----------------|----------------------------------------|
| Bug Bounty      | Bug bounty program discovery           |
| SQLi            | SQL injection dorks (30,000+)         |
| XSS             | Cross-site scripting dorks            |
| LFI             | Local file inclusion (7,000+)         |
| RFI             | Remote file inclusion (2,800+)        |
| CCTV            | Open webcam & CCTV dorks             |
| Shodan          | Shodan search dorks                   |
| Censys          | Censys intelligence dorks             |
| GitHub          | GitHub secret/credential dorks        |
| Cloud           | AWS, Azure, GCP exposure dorks        |
| CMS             | WordPress, Joomla, Laravel, Magento   |
| Admin Panels    | Admin panel discovery                 |
| Login Portals   | Login portal dorks (1,500+)          |
| Sensitive Files | Exposed files & passwords (400+)     |
| Sensitive Dirs  | Exposed directories (450+)           |
| Vuln Servers    | Vulnerable server dorks              |
| Log Files       | Exposed log files                    |
| IoT Devices     | Internet-of-Things device dorks      |
| Error Messages  | Error message disclosure dorks       |
| Network & Vuln  | Network vulnerability data dorks     |

## Recon Modules
- Header Analysis, Redirect Analysis, Metadata Collection
- DNS Lookup, WHOIS, Google Dorks
- VirusTotal Integration (API key required)
- URLScan Integration (API key required)

## API Endpoints
```
POST /api/scan/run          - Run recon scan
GET  /api/scan/:id          - Get scan by ID
GET  /api/dorks/categories  - List all dork categories with counts
GET  /api/dorks/search?q=   - Search across all dork files
GET  /api/dorks/:category?page=&limit=&domain= - Get dorks by category
GET  /api/history           - Scan history (MongoDB)
DELETE /api/history/:id     - Delete scan record
```
