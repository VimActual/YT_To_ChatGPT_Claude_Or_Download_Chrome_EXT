# YouTube Transcript Sender 📺✨

A Chrome extension that extracts YouTube video transcripts and sends them directly to ChatGPT or Claude for instant analysis, summaries, or discussion.

![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)
![YouTube](https://img.shields.io/badge/YouTube-Transcripts-FF0000?style=for-the-badge&logo=youtube&logoColor=white)
![ChatGPT](https://img.shields.io/badge/ChatGPT-Compatible-74aa9c?style=for-the-badge&logo=openai&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-Compatible-5865F2?style=for-the-badge&logo=anthropic&logoColor=white)

## ✨ Features

- 🚀 **One-Click Extraction** - Extract any YouTube video transcript with timestamps
- 🤖 **Auto-Paste to AI** - Automatically inserts transcripts into ChatGPT or Claude
- 📝 **Smart Analysis** - Optional instructions for structured video summaries
- 💾 **Download Option** - Save transcripts as text files for later use
- 🎯 **Customizable** - Toggle analysis instructions on/off
- 🌙 **Dark Mode Support** - Seamlessly integrates with YouTube's theme

## 🎬 Demo

1. Navigate to any YouTube video with captions
2. Click the ChatGPT or Claude button above the related videos
3. Watch as the transcript is automatically extracted and sent to your chosen AI
4. Get instant summaries, answers, and insights!

## 📋 What Gets Sent to AI

When "Include analysis instructions" is checked, the AI will:
1. **Create an anti-clickbait headline** - A clear, informative summary
2. **Answer the video's main question** - Direct response to the title
3. **Bullet-point breakdown** - All notable points in order
4. **Verdict** - Whether the video is worthwhile or clickbait

Example output format:
```
Anti-Clickbait Headline: "Awnings can cut cooling bills by 20% but fell out of fashion when AC became widespread"

Answer: Window awnings are a simple, effective cooling technology...

Key Points:
• Awnings can reduce cooling energy by 20%
• They work by preventing direct sunlight...
• Modern materials make them more durable...

Verdict: Useful and informative - provides concrete data and actionable advice
```

## 🛠️ Installation

### From Source (Developer Mode)

1. **Download the extension**
   ```bash
   git clone https://github.com/VimActual/YT_To_ChatGPT_Claude_Or_Download_Chrome_EXT
   cd YT_To_ChatGPT_Claude_Or_Download_Chrome_EXT
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the extension folder

4. **Ready to use!**
   - Navigate to any YouTube video
   - Look for the extension UI above related videos

## 📁 File Structure

```
youtube-transcript-sender/
├── manifest.json          # Extension configuration
├── content.js            # Main transcript extraction logic
├── content.css           # UI styling
├── background.js         # Service worker for auto-paste
├── popup.html            # Extension popup
├── popup.js              # Popup functionality
├── icon16.png            # Extension icons
├── icon48.png
└── icon128.png
```

## 🔧 Technical Details

### How It Works

1. **Content Script** (`content.js`)
   - Injects UI into YouTube pages
   - Extracts transcript from YouTube's transcript panel
   - Handles all user interactions

2. **Background Script** (`background.js`)
   - Opens new tabs for ChatGPT/Claude
   - Injects transcript into AI chat interfaces
   - Manages cross-tab communication

3. **Smart Extraction**
   - Multiple fallback strategies for finding transcripts
   - Handles various YouTube UI layouts
   - Preserves timestamps and formatting

### Permissions Used

- `activeTab` - Access current YouTube tab
- `clipboardWrite` - Copy transcripts as backup
- `tabs` & `scripting` - Auto-paste functionality
- Host permissions for YouTube, ChatGPT, and Claude

## 🎯 Use Cases

- 📚 **Research** - Quickly analyze educational content
- 📰 **News Analysis** - Get unbiased summaries of news videos
- 🎓 **Study Aid** - Extract lecture transcripts for notes
- ⏱️ **Time Saver** - Check if long videos are worth watching
- 🔍 **Fact Checking** - Analyze claims made in videos
- 📖 **Accessibility** - Read video content instead of watching

## 🐛 Troubleshooting

### "Extension context invalidated" Error
- Simply refresh the YouTube page
- This happens when the extension is updated/reloaded

### Transcript Not Found
- Ensure the video has captions (CC button available)
- Try clicking "Show transcript" manually first
- Some live streams don't have transcripts

### Auto-Paste Not Working
- The extension will fall back to clipboard copy
- Just press Ctrl+V (Cmd+V on Mac) in ChatGPT/Claude
- Make sure you've granted necessary permissions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for quick video summaries
- Built for researchers, students, and busy professionals
- Thanks to all contributors and users

## 🔒 Privacy

- **No data collection** - All processing happens locally
- **No external servers** - Direct communication with ChatGPT/Claude only
- **No tracking** - Your viewing habits remain private
- **Open source** - Verify the code yourself

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/youtube-transcript-sender/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/youtube-transcript-sender/discussions)

---

Made with ❤️ for the YouTube community. Save time, learn more! 🚀
