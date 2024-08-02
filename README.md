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

## Running the Application

1. Start the tracker:

```bash
npm run tracker
```

2. Create a `.env` file in the root directory of the project and set the environment variables:

```bash
TRACKER_URL="wss://tracker.your-domain.com" # URL of the WebTorrent tracker - default: ws://localhost:8106, use wss:// for secure connections
STUN_SERVER_URL="stun:stun.nextcloud.com:443" # Optional - there are public STUN servers available - not used if unset
TURN_SERVER_URL="turn:your-turn-server-url" # Optional - you would need to set up your own TURN server - don't set this if you don't have one
TURN_SECRET="your-static-auth-secret" # Required if you have a TURN server - don't set this if you don't have one
```

If you are using a reverse proxy, you should set the `TRACKER_URL` to the URL of the tracker behind the reverse proxy, e.g. `wss://tracker.your-domain.com`.

The STUN and TURN server URLs should be set to the public URLs of your STUN and TURN servers, if you have them.

3. Start the application:

```bash
. .env
npm start
```

4. Open your browser and navigate to `http://localhost:8105` (or the URL you have configured in your reverse proxy)

### Production

For production, you should use a process manager like systemd to keep the application running. You can use the systemd files provided in [contrib/systemd](contrib/systemd) as a starting point.

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
