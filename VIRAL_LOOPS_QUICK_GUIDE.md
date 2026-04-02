# Viral Loops - Quick Guide

## What's New? 🎉

Music Blocks now has built-in social sharing and viral growth features!

## Key Features

### 🔗 Easy Sharing
Share your projects to:
- Twitter/X
- Facebook  
- WhatsApp
- Email
- Copy link

### 🏆 Achievements
Earn badges for sharing:
- **First Share** - Share your first project
- **Social Butterfly** - Share 5 projects
- **Influencer** - Share 10 projects

### 👥 Referral System
- Get your unique referral code
- Share links automatically include your code
- Track when friends join via your links

## How to Use

### Share a Project

1. Click "Find and share projects" button
2. Go to Local or Global tab
3. Click the **iOS share icon** (📤) on any project
4. Choose your platform
5. Share!

### View Your Stats

- Open share modal to see:
  - Your referral code
  - Total projects shared
  - Available achievements

## For Developers

```javascript
// Access viral loops
window.viralLoops.showShareModal(title, projectId, imageUrl);

// Track shares
window.viralLoops.trackShare('platform-name');

// Generate share URL
const url = window.viralLoops.generateShareURL(projectId, options);
```

## Files Added

- `js/ViralLoops.js` - Core functionality
- `css/viral-loops.css` - Styling
- `VIRAL_LOOPS_IMPLEMENTATION.md` - Full documentation

## Files Modified

- `index.html` - Added scripts and styles
- `js/activity.js` - Initialize viral loops
- `planet/js/GlobalCard.js` - Added share button
- `planet/js/LocalCard.js` - Added share button

## Benefits

✅ Increases user engagement  
✅ Encourages project sharing  
✅ Grows Music Blocks community  
✅ Gamifies the sharing experience  
✅ Tracks viral growth metrics  
✅ No external dependencies  
✅ Privacy-friendly (local storage only)

## Issue Reference

Solves: [#5944 - Add viral loops across musicblocks](https://github.com/sugarlabs/musicblocks/issues/5944)

---

**Start sharing and help Music Blocks grow! 🎵🚀**
