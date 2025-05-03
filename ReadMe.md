# Chat App

A chat application following SOLID principles.

## Features

- Real-time messaging using Socket.IO
- RESTful API built with Express
- Environment configuration with dotenv
- UUID-based user and group IDs
- CORS enabled

## Technologies

- Node.js
- Express
- Socket.IO
- Jest for testing

## Prerequisites

- Node.js v14+ installed
- npm

## Installation

```bash
git clone <repository-url>
cd Chat_App
npm install
```

## Configuration

Create a `.env` file in the root:

```dotenv
PORT=3000
```

## Usage

Start in development mode:

```bash
npm run dev
```

Start in production mode:

```bash
npm start
```

Open `chat.html` in the `public` folder or navigate to `http://localhost:3000`.

## Scripts

- `npm run dev` - start with nodemon
- `npm start` - start in production mode
- `npm test` - run tests
- `npm run test:watch` - run tests in watch mode
- `npm run test:coverage` - generate coverage report

## Project Structure

```
.
├── src
│   ├── index.js       # Entry point
│   ├── models         # Data models
│   ├── controllers    # Request handlers
│   └── …
├── public             # Static assets
├── tests              # Jest tests
└── ReadMe.md          # This file
```

## Contributing

Contributions are welcome. Please open issues and submit PRs.

## License

This project is licensed under the ISC License.