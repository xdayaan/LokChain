# Blockchain Voting System

A secure, decentralized voting system built on Ethereum blockchain with a modern web interface. This system ensures transparency, immutability, and privacy in the voting process through smart contracts and cryptographic techniques.

## 🚀 Features

- **Decentralized Voting**: All votes are recorded on the Ethereum blockchain for immutability
- **Secure Authentication**: JWT-based authentication with encrypted private keys
- **Real-time Results**: Live vote counting and result visualization
- **Admin Dashboard**: Complete poll management and voter registration
- **Gasless Voting**: Users don't need ETH to vote (admin covers gas fees)
- **Encrypted Votes**: Vote data is encrypted before blockchain storage
- **Poll Management**: Create, manage, and monitor voting polls
- **Voter Verification**: Ensure only registered voters can participate

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** with Prisma ORM
- **Web3.js** for blockchain interaction
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Axios** for API calls

### Blockchain
- **Solidity 0.8.20** for smart contracts
- **Truffle** for contract development
- **Ganache** for local blockchain
- **OpenZeppelin** for secure contract libraries

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **Ganache** (local blockchain)
- **Truffle** (smart contract framework)
- **Git**

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/blockchain-voting-system.git
cd blockchain-voting-system
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb voting_system

# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/voting_system"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
GANACHE_URL="http://127.0.0.1:7545"
CONTRACT_ADDRESS="your-deployed-contract-address"
ADMIN_PRIVATE_KEY="your-admin-private-key"
ADMIN_WALLET_ADDRESS="your-admin-wallet-address"
PORT=3001
NODE_ENV=development
```

### 3. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view database
npm run db:studio
```

### 4. Blockchain Setup

```bash
# Install Truffle globally (if not already installed)
npm install -g truffle

# Navigate to root directory
cd ..

# Compile smart contracts
truffle compile

# Start Ganache (in another terminal)
ganache-cli

# Deploy contracts to local blockchain
truffle migrate --reset
```

### 5. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
```

Edit the `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🚀 Running the Application

### Development Mode

1. **Start Backend** (Terminal 1):
```bash
cd backend
npm run dev
```

2. **Start Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

3. **Start Ganache** (Terminal 3):
```bash
ganache-cli
```

### Production Mode

1. **Build Frontend**:
```bash
cd frontend
npm run build
npm start
```

2. **Start Backend**:
```bash
cd backend
npm start
```

## 📖 Usage

### Admin Workflow

1. **Register Admin**:
   - POST `/api/admin/register`
   - Body: `{ "email": "admin@example.com", "password": "securepassword", "walletAddress": "0x..." }`

2. **Admin Login**:
   - POST `/api/admin/login`
   - Body: `{ "email": "admin@example.com", "password": "securepassword" }`

3. **Create Poll**:
   - POST `/api/admin/polls`
   - Headers: `Authorization: Bearer <token>`
   - Body: `{ "title": "Election 2024", "description": "Presidential Election", "options": ["Candidate A", "Candidate B"], "duration": 3600 }`

4. **Register Voter**:
   - POST `/api/admin/voters`
   - Headers: `Authorization: Bearer <token>`
   - Body: `{ "email": "voter@example.com", "walletAddress": "0x..." }`

### Voter Workflow

1. **Voter Login**:
   - POST `/api/user/login`
   - Body: `{ "voterId": "VOTER_123456", "password": "password" }`

2. **View Active Polls**:
   - GET `/api/polls/active`
   - Headers: `Authorization: Bearer <token>`

3. **Submit Vote**:
   - POST `/api/polls/vote`
   - Headers: `Authorization: Bearer <token>`
   - Body: `{ "pollId": 1, "selectedOption": "Candidate A" }`

## 🔗 API Endpoints

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/register` | Register new admin |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/polls` | Create new poll |
| GET | `/api/admin/polls` | Get all polls |
| GET | `/api/admin/polls/:id/results` | Get poll results |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/login` | Voter login |
| POST | `/api/user/register` | Register new voter |

### Poll Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/polls/active` | Get active polls |
| POST | `/api/polls/vote` | Submit vote |

## 📁 Project Structure

```
blockchain-voting-system/
├── backend/
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── admin.js             # Admin API routes
│   │   ├── polls.js             # Poll API routes
│   │   └── user.js              # User API routes
│   ├── utils/
│   │   ├── crypto.js            # Cryptographic utilities
│   │   └── web3.js              # Blockchain utilities
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── contracts/               # Smart contract ABIs
│   ├── server.js                # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app router
│   │   │   ├── admin/           # Admin pages
│   │   │   ├── login/           # Login page
│   │   │   └── vote/            # Voting page
│   │   ├── components/          # React components
│   │   └── utils/               # Frontend utilities
│   └── package.json
├── contracts/
│   └── VotingSystem.sol         # Main smart contract
├── migrations/
│   └── 2_deploy_voting_system.js # Contract deployment
├── test/
│   └── VotingSystem.test.js     # Contract tests
├── truffle-config.js            # Truffle configuration
└── README.md
```

## 🔐 Security Features

- **Encrypted Votes**: All votes are encrypted before blockchain storage
- **Private Key Management**: Secure handling of voter private keys
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **JWT Authentication**: Secure token-based authentication
- **Blockchain Immutability**: Votes cannot be altered once recorded

## 🧪 Testing

### Smart Contract Tests

```bash
# Run contract tests
truffle test

# Run with coverage
npm run test:coverage
```

### API Tests

```bash
# Run API tests
cd backend
npm test

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Smart Contract Deployment

```bash
# Deploy to testnet
truffle migrate --network testnet

# Deploy to mainnet
truffle migrate --network mainnet
```

### Application Deployment

1. **Build Frontend**:
```bash
cd frontend
npm run build
```

2. **Deploy Backend**:
```bash
cd backend
npm run build
# Deploy to your preferred hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

## 🔄 Future Enhancements

- [ ] Multi-chain support (Polygon, BSC, etc.)
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Integration with government ID systems
- [ ] Real-time vote monitoring
- [ ] Enhanced security audits
- [ ] Decentralized identity integration

---

**Built with ❤️ for secure and transparent democratic processes**