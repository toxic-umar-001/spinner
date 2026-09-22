# Decision Spinner Wheel

A production-ready, fully responsive, and interactive **Choice & Decision Spinner Wheel** built with pure HTML5, CSS3, and Vanilla JavaScript. No frameworks, no external dependencies. Perfect for embedding in websites, blogs, or WordPress.

## Features

- **Interactive Canvas Spinner Wheel** with smooth physics-based deceleration (quartic ease-out) and random stop angles
- **Custom Option Editor** — live add, edit, toggle on/off, delete, and color-pick individual wheel segments
- **Victory Modal** with celebratory confetti particle animation
- **Sound FX** using the Web Audio API (no audio files needed) — toggle on/off at any time
- **Haptic Vibration** support on mobile devices
- **3 Preset Themes**: Dark Mode (default), Neon Gradient, Clean Modern
- **Quick Presets**: Yes/No, Food Picks, Numbers 1–10
- **Mobile-First Responsive Design** with touch-friendly controls
- **Keyboard Accessible** — press Space or Enter to spin
- **Zero External Dependencies** — runs entirely in the browser

## File Structure

```
├── index.html      # HTML markup & layout
├── style.css       # All styling, themes, and responsive rules
├── app.js          # Wheel logic, physics, editor, sound, confetti
├── README.md       # This file
└── package.json    # Build config (Vite)
```

## Quick Start (Local Development)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open the URL shown in your terminal (typically `http://localhost:5173`).

4. To create a production build:
   ```bash
   npm run build
   ```

   The built files will be in the `dist/` directory. Preview the build with:
   ```bash
   npm run preview
   ```

## Customization

### Changing the Default Options

Open `app.js` and modify the `PRESETS` object, or edit the `init()` function at the bottom of the file to load a different preset on startup:

```javascript
function init() {
  setupCanvas();
  setTheme('dark');
  loadPreset('food');  // Change this to any preset key or remove for empty start
}
```

### Adding Your Own Preset

Add an entry to the `PRESETS` object in `app.js`:

```javascript
const PRESETS = {
  'my-preset': [
    { label: 'Option A', color: '#6366f1', enabled: true },
    { label: 'Option B', color: '#06b6d4', enabled: true },
    { label: 'Option C', color: '#10b981', enabled: true },
  ],
};
```

Then add a button in `index.html` inside the `.presets-row` div:

```html
<button class="preset-btn" data-preset="my-preset">My Preset</button>
```

### Changing the Color Palette

Modify the `PALETTE` array in `app.js` to change the auto-assigned colors when adding new options:

```javascript
const PALETTE = ['#6366f1', '#06b6d4', '#10b981', /* ... */];
```

### Changing the Theme

Three themes are available via CSS data-attributes on the `<html>` element:
- `data-theme="dark"` — Dark Mode (default)
- `data-theme="neon"` — Neon Gradient
- `data-theme="clean"` — Clean Modern / Light

Users can switch themes via the theme buttons in the header. To set a default theme, edit the `init()` function:

```javascript
setTheme('neon');  // Change 'dark' to 'neon' or 'clean'
```

### Customizing Theme Colors

All colors are defined as CSS custom properties in `style.css`. Modify the `:root` block and the `[data-theme="..."]` blocks to change colors for each theme.

### Spin Duration & Physics

In `app.js`, adjust the `spin()` function:
- `turns` (line ~165): Number of full rotations (default: 5–8)
- `duration` (line ~171): Spin time in milliseconds (default: 4.5–6 seconds)
- `easeOutQuart`: Change the easing function for different deceleration curves

## WordPress Embedding

### Method 1: Iframe Embed (Recommended)

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the contents of the `dist/` folder to your server (e.g., to a subdirectory like `https://yoursite.com/spinner/`).

3. In WordPress, add an **HTML block** or use the **Custom HTML** widget and paste:

   ```html
   <iframe src="https://yoursite.com/spinner/" 
           width="100%" 
           height="750" 
           style="border:none; border-radius:12px;" 
           loading="lazy"
           title="Decision Spinner Wheel">
   </iframe>
   ```

4. Adjust the `height` as needed (recommended: 750–850px for desktop).

### Method 2: Shortcode Wrapper

Add this to your theme's `functions.php` to create a reusable shortcode:

```php
// Add to functions.php
function spinner_wheel_shortcode($atts) {
    $atts = shortcode_atts(array(
        'url'    => 'https://yoursite.com/spinner/',
        'height' => '750',
    ), $atts);

    return sprintf(
        '<iframe src="%s" width="100%%" height="%d" style="border:none; border-radius:12px;" loading="lazy" title="Decision Spinner Wheel"></iframe>',
        esc_url($atts['url']),
        intval($atts['height'])
    );
}
add_shortcode('spinner_wheel', 'spinner_wheel_shortcode');
```

Then use in any post or page:

```
[spinner_wheel url="https://yoursite.com/spinner/" height="800"]
```

### Method 3: Direct Embed (Advanced)

You can also copy the contents of the built `index.html`, `style.css`, and `app.js` directly into WordPress:

1. Upload `style.css` and `app.js` to your theme's assets folder.
2. In a Custom HTML block, paste the HTML structure and enqueue the CSS/JS files, or use `<link>` and `<script>` tags pointing to the uploaded files.

> **Note:** The iframe method is the most reliable approach since it avoids CSS conflicts with your WordPress theme.

## Browser Support

- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## License

This project is sold as a digital asset. Please refer to your marketplace license terms for usage and distribution rights.
