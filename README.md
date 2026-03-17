# LoomGuard

> **Advanced EVM Bytecode Threat Intelligence** — Track malicious smart contract developers across chains using bytecode stylometry, not just token trails.

## 🛡️ Overview

LoomGuard is a next-generation security tool designed to identify and track smart contract developers by their unique coding patterns. By analyzing EVM bytecode directly, LoomGuard can detect similarities between contracts even when they are deployed from different addresses, making it a powerful tool for threat intelligence and forensic analysis.

## ✨ Key Features

- **Bytecode Stylometry**: Analyze 256-dimensional opcode vectors to identify developer "fingerprints".
- **Cosine Similarity Search**: Rapidly find similar contracts across multiple chains using `pgvector`.
- **CBOR Metadata Extraction**: Automatically extract compiler versions and IPFS hashes from contract metadata.
- **GitHub OSINT Bridge**: Automatically link contract fingerprints to potential GitHub identities.
- **Multi-Chain Support**: Native support for Ethereum, Base, Polygon, Arbitrum, and more.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) with `pgvector` for similarity search
- **Web3**: [ethers.js v6](https://docs.ethers.org/v6/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project with the `pgvector` extension enabled.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Max707777/LoomGaurd.git
   cd LoomGaurd/loomguard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GITHUB_TOKEN=your_github_personal_access_token # For OSINT enrichment
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

---

Built with 💜 for the Ethereum Security Community.
