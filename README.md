# @apostrophecms/event
Note: This module is in Alpha and not ready for use. It is a community-supported bundle and contributions are welcome!

This bundle is intended to provide event functionality (concerts, recurring webinars, etc.) with <a href="https://apostrophecms.com/">Apostrophe CMS 3</a>. It is based on the `apostrophe-events` bundle for Apostrophe CMS 2.

## Stable release punch list
- [x] The index page should only show upcoming published events, unless filtered by year, month, or day
- [x] Index page default template should use H2 and H3 headings for sections (filters and events) and a paragraph or `date` for the date.
- [x] Index page should have pagination.
- [ ] needs localization keys
- [x] Make event description optional
- [x] Change `groupId` to `eventGroupId`
- [ ] Fix day `finalize` function to [capture multi-day events containing the date](https://github.com/apostrophecms/event/pull/4/files#r758619825)
- [ ] Fill out the README