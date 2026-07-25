# Allted

Allted is an offline file converter designed for quick, private, and painless file format changes. Everything runs directly on your computer, so your files stay strictly on your device without ever being uploaded to a third-party server.

Whether you need to adjust image quality, convert videos to different resolutions, or transform documents, Allted handles it locally with zero latency.

## Features

- **Offline File Processing**: Converts files locally on your system to protect your privacy and eliminate upload waiting times.
- **Image Conversion**: Adjust quality with a dedicated percentage slider to get the exact file size and clarity you need.
- **Video Editing & Rescaling**: Convert video containers and adjust video resolution with presets (SD, HD, FHD, 2K, 4K, 8K) or custom width and height settings.
- **Instant Previews**: Inspect converted images, listen to audio files, watch video previews, or view text files before saving.
- **Custom Export Locations**: Choose exactly where you want to export your saved files with standard OS file pickers.
- **Wide Format Support**: Works across image, video, audio, document, and data formats.

## Tech Stack

- **Frontend**: React, JavaScript (ES6+), Tailwind CSS
- **Build Tool**: Vite
- **Desktop Framework**: Tauri
- **Icons**: Lucide React

## Getting Started

### Prerequisites

Make sure you have Node.js installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/noxidda/Allted.git
   ```

2. Navigate into the project folder:
   ```bash
   cd Allted
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the development server:
```bash
npm run dev
```

### Desktop App Development (Tauri)

To launch the desktop app via Tauri:
```bash
npm run tauri dev
```

### Production Build

To build the web application:
```bash
npm run build
```

To build the desktop bundle:
```bash
npm run tauri build
```

## License

MIT
