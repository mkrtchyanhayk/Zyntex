# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-11-25
### Added
- **Profile Enhancements**:
  - Added tabs for "Posts", "Liked", "Comments", and "Settings".
  - Added "Settings" tab for profile editing (Avatar, Bio, Privacy) and username changes.
  - Added visibility for like and comment counts on user's own posts.
- **Modal Positioning**:
  - Implemented React Portals for Modals to ensure they are always centered in the viewport, regardless of scroll position.

### Fixed
- **Theme Compatibility**:
  - Refactored `Feed.js`, `App.js`, `Messages.js`, `Groups.js`, `Register.js`, `Search.js`, `ForgotPassword.js`, `Changelog.js`, and `Modal.js` to use theme-aware CSS variables (`text-primary`, `text-secondary`) instead of hardcoded white text.
  - Fixed `Modal.js` header background in light mode.
- **UI/UX**:
  - Fixed "Compose Post" modal positioning issues.
  - Improved readability of text across the application in both light and dark modes.

## [1.0.0] - 2025-11-21
### Added
- Initial release
- Feed with reactions
- DM system
- Groups
- User profiles
- Follow system
- GIF support

## [0.9.0] - 2025-11-20
### Changed
- Improved UI/UX
- Fixed scroll behavior
- Added theme support
- Enhanced reactions display
