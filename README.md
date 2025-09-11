# Organization Website Template

This repository hosts the "organization-website" template from the Allegheny College ACM Student Chapter's "Personal Website" workshop series.

This template and workshop were created by [Alish Chhetri](https://github.com/AlishChhetri).

## Getting Started

This template provides a clean, responsive organization website with search functionality, a calendar for events, and a blog section.

## Configuration Files

### Sitemap Configuration

The website uses a JSON file for search functionality and site navigation:

- `assets/js/sitemap.json`: Defines the site structure for navigation and search

> **Important:** This file needs to be updated when adding new pages to ensure proper search functionality.

#### How to add a new page:

1. Create your new HTML page in the appropriate directory (e.g., pages/blog/new_post.html)
2. Add the page to the sitemap.json file with the following format:

```json
{
  "url": "/pages/blog/new_post.html",
  "badge": "blog", 
  "title": "Your Page Title"
}
```

### Calendar Events

Event data is stored in `assets/js/calendar.json`. Each event has the following structure:

```json
{
  "date": "YYYY-MM-DD",
  "events": [
    {
      "title": "Event Title",
      "description": "Event description",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "type": "event-type"
    }
  ]
}
```

#### Adding new calendar events:

1. Open `assets/js/calendar.json`
2. Add a new object to the `events` array using the format above
3. If adding multiple events on the same date, place them in the same date's `events` array
4. Make sure the date format is exactly `YYYY-MM-DD` (e.g., `2025-04-01`)

Event types determine the color coding in the calendar:
- "holiday" (red)
- "deadline" (yellow)
- "break" (green)
- "milestone" (purple)
- "meeting" (blue)
- "general" (gray)

## File Structure

- `index.html` - Main landing page
- `pages/` - General pages
  - `about.html` - About page
  - `blog.html` - Blog listing
  - `events.html` - Events listing
  - `blog/` - Individual blog posts
  - `events/` - Individual event pages
- `assets/` - Resource files
  - `css/` - Stylesheets
  - `js/` - JavaScript files
  - `images/` - Images and other media

## Important Notes

1. When linking between pages, use relative paths:
   - From root to pages: `./pages/about.html`
   - From pages to root: `../index.html`
   - From subpages to pages: `../about.html`
   - From subpages to root: `../../index.html`

2. Make sure all links and asset references are correctly pathed based on the file's location.

3. The search functionality works on both local development and when deployed to GitHub Pages.

4. **Warning:** Do not modify the JavaScript files (`search.js`, `carousel.js`, `calendar.js`) unless you have experience with JavaScript. Making changes to these files can break functionality. Instead, use the JSON configuration files to customize the website.

5. When fixing broken links, check:
   - CSS paths in HTML files (should be relative to the file location)
   - Image paths 
   - Navigation links between pages

6. If using this template for your organization:
   - Update the organization name in all HTML files
   - Replace placeholder images with your own
   - Update the footer social links with your organization's accounts

7. The logo text "AC" can be replaced with your organization's initials or logo image.
