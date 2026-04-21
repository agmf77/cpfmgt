# PBS CPF Management Software

Management Accounting Software for Contributory Provident Fund (CPF). Developed for Gazipur Palli Bidyut Samity-2.
#git push -u origin main
## Key Features
- **Member Registry**: Manage personnel profiles and account statuses.
- **Journal Entries**: Dual-accounting system with automatic subsidiary ledger synchronization (works in both Firebase and local database modes).
- **Interest Accrual**: Automated monthly and special (Day-Product) interest calculations with balanced rounding.
- **Institutional Reports**: Statement of Financial Position, Comprehensive Income, Netfund Statements, and more.
- **Ledger Summary Matrix**: Automatically updates with subsidiary ledger data in real-time.
- **Subsidiary Control**: Real-time synchronization with journal entries and ledger data.
- **Audit Tools**: Detailed drill-downs for subsidiary control and GL tracing.
- **Local Database Mode**: Full offline functionality with automatic report synchronization.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Database**: Local IndexedDB (Dexie) - Full offline mode
- **Authentication**: Local offline authentication
- **AI**: Google Gemini via Genkit
- **Real-time Updates**: Automatic report synchronization every 2 seconds in local mode

## Development
Developed by: **Ariful Islam, AGMF, Gazipur PBS-2**
