# Sound Files Directory

This directory contains notification sound files for the CRM system.

## Required Sound File

Please add the following sound file to this directory:

- **new-notification-022-370046.mp3** - The notification sound for new orders

## How to Add the Sound File

1. Copy your `new-notification-022-370046.mp3` file to this directory
2. Ensure the file is named exactly `new-notification-022-370046.mp3`
3. The file should be in MP3 format
4. Recommended file size: under 100KB for optimal performance

## File Structure

```
casa-crm/public/sounds/
├── README.md (this file)
└── new-notification-022-370046.mp3 (your sound file)
```

## Testing

Once you've added the sound file, you can test it by:

1. Starting the CRM application
2. Clicking the sound settings button (volume icon) in the top bar
3. Using the "Test Notification Sound" button in the settings panel

## Troubleshooting

If the sound doesn't play:

1. Check that the file is in the correct location
2. Verify the file name matches exactly
3. Ensure the file is in MP3 format
4. Check browser console for any error messages
5. Make sure sound is enabled in the settings

The system will automatically fall back to a generated beep sound if the audio file fails to load.
