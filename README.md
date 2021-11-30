## Stable release punch list
- [x] The index page should only show upcoming published events, unless filtered by year, month, or day
- [x] Index page default template should use H2 and H3 headings for sections (filters and events) and a paragraph or `date` for the date.
- [x] Index page should have pagination.
- [x] needs localization keys
- [x] Make event description optional
- [x] Change `groupId` to `eventGroupId`
- [x] Fix day `finalize` function to [capture multi-day events containing the date](https://github.com/apostrophecms/event/pull/4/files#r758619825)
- [x] Fill out the README

[![CircleCI](https://circleci.com/gh/apostrophecms/event/tree/master.svg?style=svg)](https://circleci.com/gh/apostrophecms/event/tree/master)
[![Chat on Discord](https://img.shields.io/discord/517772094482677790.svg)](https://chat.apostrophecms.org)

<p align="center">
  <a href="https://github.com/apostrophecms/event">
    <!-- TODO:  -->
    <img src="https://raw.githubusercontent.com/apostrophecms/apostrophe/main/logo.svg" alt="ApostropheCMS logo" width="80" height="80">
  </a>

  <h1 align="center">Apostrophe Events</h1>
</p>

This module bundle helps developers quickly add event content to Apostrophe 3 websites. It provides the event piece type (`@apostrophecms/event`) as well as a special page type (`@apostrophecms/event-page`) for editors to create an event listing.

## Installation

To install the module, use the command line to run this command in an Apostrophe project's root directory:

```
npm install @apostrophecms/event
```

## Usage

Configure the event modules in the `app.js` file:

```javascript
require('apostrophe')({
  shortName: 'my-project',
  modules: {
    // The main event piece type module
    '@apostrophecms/event': {},
    // The event page module
    '@apostrophecms/event-page': {}
  }
});
```

### Enable the page type

To enable the event page type for editor to select, add it to the `@apostrophecms/page` configuration:

```javascript
// modules/@apostrophecms/page/index.js
module.exports = {
  options: {
    types: [
      {
        name: '@apostrophecms/home-page',
        label: 'Home'
      },
      // Adding the event page type
      {
        name: '@apostrophecms/event',
        label: 'Event Page'
      }
    ]
  }
};
```

**Note:** The index page template (`index.html`), filters template partial (`filters.html`), and show page template (`show.html`) are primarily meant as a starting point for a project. They demonstrate much of the available template data, but developers will almost always want to override them to implement proper styles and layout.

### Filtering by year, month, and day

The event page module, `@apostrophecms/event-page`, provides query filters to refine event results by year, month, and day. These are primarily used for index page filters (see the `filters.html` file), but can also be used in REST API requests and server-side queries. Events that span multiple consecutive days are included in results if the query is at least partially included in their date span.

| Filter Name | Description | Expected Format |
|-------------|-------------|-----------------|
| `year` | Filter by event year | `YYYY` |
| `month` | Filter by event month | `YYYY-MM` |
| `day` | Filter by event day | `YYYY-MM-DD` |

### Multiple event piece types

Sometimes a website needs multiple, distinct types of events. If the event types can be managed together, it might be easiest to [add a new field](https://v3.docs.apostrophecms.org/guide/content-schema.html#using-existing-field-groups) and [query builder](https://v3.docs.apostrophecms.org/reference/module-api/module-overview.html#queries-self-query) to customize event views. But if the event types should be managed completely separately, it may be better to create separate  piece types for each.

Just as we [extend `@apostrophecms/piece-type`](https://v3.docs.apostrophecms.org/guide/pieces.html#creating-a-piece-type) to create a new piece type, we can extend `@apostrophecms/event` to create a new event type. The event type will need its own module directory and UI labels. It can simply inherit the original templates, fields, and other configuration or override them in the event type's `index.js` file.

A special event type that has an event URL field might look like this:

```javascript
// modules/special-event/index.js
module.exports = {
  extend: '@apostrophecms/event',
  options: {
    label: 'Special Event',
    pluralLabel: 'Special Events'
  },
  fields: {
    add: {
      eventUrl: {
        label: 'Event URL',
        type: 'url'
      }
    },
    group: {
      basics: { fields: [ 'eventUrl' ] }
    }
  }
}
```

To display custom event types on a page, we would need to do the same for the event page module. All custom modules would need to be instantiated in the `app.js` file like any other module.

```javascript
// modules/special-event-page/index.js
module.exports = {
  extend: '@apostrophecms/event-page'
}
```

Do this as many times as you need custom event types. Adding filtering and new fields to the base event module is usually enough for most use cases, but organizations with more complex event needs will find this strategy helpful.