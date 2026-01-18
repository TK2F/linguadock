# Changelog

All notable changes to LinguaDock will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-18

### Added
- **Multi-language support**: Polish, English, German, French, Spanish, Italian, Portuguese, Indonesian, Russian, Korean, Chinese, Thai, Vietnamese
- **Dataset management**: Load/unload/delete individual CSV files
- **Dataset persistence**: Data survives browser restarts (chrome.storage.local)
- **AI prompt generator**: Create vocabulary CSVs with language and category selection
- **CSV structure guide**: Popup showing required/optional columns
- **Duplicate detection**: Prevents importing the same CSV twice
- **Error boundary**: Graceful error handling with user-friendly recovery
- **Toast notifications**: Replace alert() with modern toast UI
- **Category filtering by language**: Only show categories available in selected language
- **Indonesian language support**: New sample CSV included

### Changed
- Renamed from "Polish Bridge" to "LinguaDock"
- CSV format upgraded to v2.0 (backward compatible with v1.0)
- Language selector moved to main screen
- CSV import now adds data (additive) instead of replacing

### Fixed
- TTS language detection now uses correct language codes
- Category auto-reset when changing languages

## [1.0.0] - 2025-12-01

### Added
- Initial release
- Polish language learning quiz
- 2-choice, True/False, Fill-in-the-blank modes
- CSV import/export
- Progress tracking
- Dark mode support
- Keyboard shortcuts
