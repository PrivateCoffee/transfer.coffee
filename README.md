# Transfer.coffee

[![Support Private.coffee!](https://shields.private.coffee/badge/private.coffee-support%20us!-pink?logo=coffeescript)](https://private.coffee)
[![Matrix](https://shields.private.coffee/badge/Matrix-join%20us!-blue?logo=matrix)](https://matrix.to/#/#private.coffee:private.coffee)
[![Latest Git Commit](https://shields.private.coffee/gitea/last-commit/privatecoffee/transfer.coffee?gitea_url=https://git.private.coffee)](https://git.private.coffee/privatecoffee/transfer.coffee)

<img src="public/img/logo.png" alt="Transfer.coffee Logo" width="200" align="right">

Transfer.coffee is a simple Node.js web application that allows users to share files using WebTorrent. Users can upload files, generate mnemonic seeds, and share these seeds with others to download the files directly via peer-to-peer connections. The application supports optional configuration of STUN and TURN servers to facilitate NAT traversal.

## Features

- Peer-to-peer file sharing using WebTorrent
- Mnemonic seed generation for easy file sharing
- Optional STUN and TURN server configuration for NAT traversal
- Progress indicators for file upload and download
- Configurable tracker URL
- Bundled WebTorrent tracker

## Prerequisites

- Node.js (tested with v22.3 but anything recent should work)
- npm

## Installation

1. Clone the repository:

```bash
git clone https://git.private.coffee/PrivateCoffee/transfer.coffee.git
cd transfer.coffee
```

2. Install the dependencies:

```bash
npm install
```

3. Optional, but recommended for production: Put the application (:8105) and the tracker (:8106) behind a reverse proxy (e.g. Caddy or nginx) and configure SSL.

## Configuration

You can configure the application using environment variables:

- `TRACKER_URL`: The WebTorrent tracker URL (default: `ws://localhost:8106`)
- `STUN_SERVER_URL`: The STUN server URL (optional - not used if unset)
- `TURN_SERVER_URL`: The TURN server URL (optional - not used if unset)
- `TURN_SECRET`: The static-auth-secret for the TURN server (required if `TURN_SERVER_URL` is set)

## Running the Application

1. Start the tracker:

```bash
npm run tracker
```

2. Set the environment variables and start the server:

```bash
export TRACKER_URL="wss://tracker.your-domain.com" # URL of the WebTorrent tracker - default: ws://localhost:8106, use wss:// for secure connections 
export STUN_SERVER_URL="stun:stun.nextcloud.com:443" # Optional - there are public STUN servers available - not used if unset
export TURN_SERVER_URL="turn:your-turn-server-url" # Optional - you would need to set up your own TURN server - don't set this if you don't have one
export TURN_SECRET="your-static-auth-secret" # Required if you have a TURN server - don't set this if you don't have one
npm start
```

3. Open your browser and navigate to `http://localhost:8105` (or the URL you have configured in your reverse proxy)

## Usage

### Sharing a File

1. Select a file to share using the file input.
2. Click the "Share" button.
3. Share the generated mnemonic seed with others.

### Receiving a File

1. Enter the mnemonic seed in the input field.
2. Click the "Receive" button.
3. The file will be downloaded directly from the peer.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

