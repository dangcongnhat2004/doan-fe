#!/usr/bin/env node

// This script post-processes the generated `dist/index.html` to
// replace the `<style id="expo-reset">` block with a targeted
// CSS override that fixes react-native-web's wrapper flex behavior.
// Reason: expo/react-native-web wraps the app in extra divs; one of
// the inner divs gets `flex: 1` which expands it and shifts content.

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('dist/index.html not found');
  process.exit(0);
}

// Read the file
let html = fs.readFileSync(indexPath, 'utf-8');

// Post-process dist - do NOT modify expo-reset, just keep the original styles
const expoResetRegex = /<style\s+id=["']expo-reset["'][\s\S]*?<\/style>/i;
if (expoResetRegex.test(html)) {
  // Keep original expo-reset, don't modify it
  console.log('✓ dist/index.html already has expo-reset styles');
} else {
  console.log('⚠ expo-reset not found in dist/index.html');
}

// Inject a separate custom stylesheet to adjust the wrapper layout
const customId = 'custom-layout';
const customRegex = new RegExp(`<style\\s+id=["']${customId}["'][\\s\\S]*?<\\/style>`, 'i');
if (customRegex.test(html)) {
  console.log(`✓ ${customId} already injected`);
} else {
  const customCss = `\n<style id="${customId}">\n  /* Keep expo-reset intact. This forces the app wrapper to center horizontally */\n  #root { display: flex; justify-content: center; align-items: flex-start; }\n  /* The outer wrapper expo adds (first child of #root) should center its contents and be constrained */\n  #root > div { display: flex; justify-content: center; align-items: flex-start; width: 100%; max-width: 420px; }\n  /* Prevent the inner wrapper from growing to full height/width */\n  #root > div > div { flex: none !important; }\n  /* Provide some breathing room so the card doesn't touch the edges */\n  #root > div > div > div { box-sizing: border-box; padding: 20px; width: 100%; }\n</style>\n`;

  // Insert before </head> so it loads after expo-reset and react-native styles
  if (html.indexOf('</head>') !== -1) {
    html = html.replace('</head>', customCss + '</head>');
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log(`✓ Injected ${customId} into dist/index.html`);
  } else {
    console.log('⚠ Could not find </head> to inject custom CSS');
  }
}

// Inject a small diagnostics script before </body> so runtime errors become visible
const diagId = 'diagnostics';
const diagRegex = new RegExp(`<script\\s+id=["']${diagId}["'][\\s\\S]*?<\\/script>`, 'i');
if (!diagRegex.test(html)) {
  const diagScript = `\n<script id="${diagId}">\n(function(){\n  function show(msg){\n    try{\n      var el=document.getElementById('diag-overlay');\n      if(!el){ el=document.createElement('div'); el.id='diag-overlay'; Object.assign(el.style,{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(255,255,255,0.98)',color:'#b00020',zIndex:999999,fontFamily:'sans-serif',padding:'16px',overflow:'auto'}); document.body.appendChild(el);}\n      el.innerText=msg;\n    }catch(e){/* ignore */}\n  }\n  window.addEventListener('error', function(e){ show('Error: '+(e && e.message) + '\\n' + (e && e.filename) + ':' + (e && e.lineno)); }, true);\n  window.addEventListener('unhandledrejection', function(ev){ show('UnhandledRejection: '+(ev && ev.reason && (ev.reason.message || ev.reason.toString()))); }, true);\n  try{ console.log('diagnostics installed'); }catch(e){}\n})();\n</script>\n`;
  if (html.indexOf('</body>') !== -1) {
    html = html.replace('</body>', diagScript + '</body>');
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log('✓ Injected diagnostics script into dist/index.html');
  } else {
    console.log('⚠ Could not find </body> to inject diagnostics script');
  }
} else {
  console.log('✓ diagnostics script already present');
}

// Ensure a visible overlay DIV exists immediately after <body> so we can detect rendering issues early
const overlayId = 'diag-overlay';
if (!new RegExp(`<div\\s+id=["']${overlayId}["']`, 'i').test(html)) {
  const overlayHtml = `\n<div id="${overlayId}" style="position:fixed;left:0;top:0;right:0;bottom:0;background:magenta;color:white;z-index:2147483646;font-family:sans-serif;padding:16px;display:flex;align-items:center;justify-content:center;">DIST BUILD: overlay active (reload to update)</div>\n`;
  // Insert right after opening <body>
  if (html.indexOf('<body') !== -1) {
    html = html.replace(/<body[^>]*>/i, function(m){ return m + overlayHtml; });
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log('✓ Injected visible overlay into dist/index.html');
  } else {
    console.log('⚠ Could not find <body> to inject overlay');
  }
} else {
  console.log('✓ overlay already present');
}
